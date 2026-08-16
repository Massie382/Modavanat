#!/usr/bin/env python3
"""
check_download_capability.py
============================

Tests whether THIS server can reach every download endpoint required to
install and build the Modavanat project (or any Next.js + Prisma + sharp
project). Pure standard library — no pip install required. Safe to scp
to a fresh server and run.

What it checks
--------------
1. System prerequisites      — OS, arch, disk, RAM, kernel
2. Required CLI tools        — node, npm, bun, git, curl/wget, python3,
                               make, gcc/g++, openssl, nginx, certbot
3. System package mirrors    — apt / yum / dnf (auto-detected)
4. Core registries           — npm, nodejs.org, bun.sh, github.com,
                               raw.githubusercontent.com, codeload.github.com,
                               pypi.org, jsr.io, binaries.prisma.sh
5. Package-specific binaries — Prisma engines, sharp libvips, SWC
                               platform packages, esbuild platform packages
6. Every npm dependency      — metadata + tarball reachability for each
                               entry in package.json (deps + devDeps)
7. Already-installed check   — is the package present in node_modules?
8. DNS resolution            — every hostname touched above is resolved

For each endpoint we test: DNS -> TCP -> TLS -> HTTP HEAD. Granular
failure info makes it obvious whether the problem is DNS, firewall,
TLS interception, or HTTP-level blocking.

Exit codes
----------
0  — every required check passed (warnings allowed)
1  — one or more required checks failed
2  — script-level error (bad args, missing package.json)

Usage
-----
    python3 check_download_capability.py
    python3 check_download_capability.py --project-dir /var/www/modavanat
    python3 check_download_capability.py --timeout 30 --verbose
    python3 check_download_capability.py --json > report.json
"""

from __future__ import annotations

import argparse
import json
import os
import platform
import shutil
import socket
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCRIPT_VERSION = "1.0.0"

# Endpoints that are NOT npm packages — checked as "infrastructure".
# (url, label, is_required, allow_4xx)
# `allow_4xx=True` means: a 4xx response counts as "host reachable" —
# useful for CDN-style hosts that 404 at the root path but serve real
# content at deep paths (objects.githubusercontent.com, binaries.prisma.sh).
INFRA_ENDPOINTS = [
    ("https://registry.npmjs.org/",                        "npm registry root",                   True,  False),
    ("https://registry.npmjs.org/next",                    "npm registry — sample metadata",      True,  False),
    ("https://nodejs.org/dist/",                           "Node.js dist",                        True,  False),
    ("https://bun.sh/",                                    "Bun website",                         True,  False),
    ("https://github.com/",                                "GitHub",                              True,  False),
    ("https://raw.githubusercontent.com/torvalds/linux/master/README",  "GitHub raw content",    True,  False),
    ("https://codeload.github.com/",                       "GitHub tarball host",                 True,  True),
    ("https://pypi.org/simple/",                           "PyPI",                                False, False),
    ("https://jsr.io/",                                    "jsr.io (Bun JSR registry)",           False, False),
    ("https://objects.githubusercontent.com/",             "GitHub release assets host",          True,  True),
    ("https://binaries.prisma.sh/all_commits/",            "Prisma engines mirror (host root)",   True,  True),
    ("https://github.com/lovell/sharp",                    "sharp GitHub repo (source)",          True,  False),
    ("https://registry.npmjs.org/@img%2Fsharp-libvips-linux-x64",  "sharp libvips npm package",   True,  False),
    ("https://download.cypress.io/",                       "Cypress binary host (if ever used)",  False, True),
    ("https://playwright.azureedge.net/",                  "Playwright CDN (if ever used)",       False, True),
    ("https://dl.google.com/",                             "Google downloads (puppeteer etc.)",   False, True),
]

# CLI tools we want on the server. (command, is_required, install_hint)
REQUIRED_CLI = [
    ("python3",  True,  "apt install python3  /  dnf install python3"),
    ("curl",     True,  "apt install curl     /  dnf install curl"),
    ("wget",     False, "apt install wget     /  dnf install wget"),
    ("git",      True,  "apt install git      /  dnf install git"),
    ("node",     True,  "install via NodeSource repo or nvm"),
    ("npm",      True,  "ships with Node.js"),
    ("bun",      False, "curl -fsSL https://bun.sh/install | bash"),
    ("make",     False, "apt install build-essential  /  dnf install make"),
    ("gcc",      False, "apt install build-essential  /  dnf install gcc"),
    ("g++",      False, "apt install build-essential  /  dnf install gcc-c++"),
    ("openssl",  True,  "apt install openssl  /  dnf install openssl"),
    ("tar",      True,  "apt install tar      /  dnf install tar"),
    ("nginx",    False, "apt install nginx    /  dnf install nginx"),
    ("certbot",  False, "apt install certbot  /  dnf install certbot"),
    ("jq",       False, "apt install jq       /  dnf install jq"),
]

# Distro package mirror URLs to test. Auto-picked by detected package manager.
APT_MIRRORS = [
    "http://deb.debian.org/debian/",
    "http://archive.ubuntu.com/ubuntu/",
    "http://security.debian.org/debian-security/",
]
YUM_MIRRORS = [
    "http://mirror.centos.org/centos/",
    "https://dl.fedoraproject.org/pub/",
    "https://vault.centos.org/",
]

# ---------------------------------------------------------------------------
# Color helpers (graceful degradation if not a TTY)
# ---------------------------------------------------------------------------

_IS_TTY = sys.stdout.isatty()

if _IS_TTY:
    RED    = "\033[0;31m"
    GREEN  = "\033[0;32m"
    YELLOW = "\033[0;33m"
    BLUE   = "\033[0;34m"
    CYAN   = "\033[0;36m"
    BOLD   = "\033[1m"
    DIM    = "\033[2m"
    NC     = "\033[0m"
else:
    RED = GREEN = YELLOW = BLUE = CYAN = BOLD = DIM = NC = ""


def c(color: str, msg: str) -> str:
    return f"{color}{msg}{NC}"


# ---------------------------------------------------------------------------
# Result tracking
# ---------------------------------------------------------------------------

class Report:
    def __init__(self) -> None:
        self.passed = 0
        self.failed = 0
        self.warned = 0
        self.skipped = 0
        self.rows: list[dict] = []  # for --json mode
        self.log_lines: list[str] = []
        self.failed_endpoints: list[str] = []

    def pass_(self, label: str, detail: str = "", *, section: str = "") -> None:
        self.passed += 1
        line = f"[PASS] {label}" + (f" — {detail}" if detail else "")
        print(c(GREEN, "✓") + " " + line)
        self.log_lines.append(line)
        self.rows.append({"section": section, "label": label, "status": "pass", "detail": detail})

    def fail(self, label: str, detail: str = "", *, section: str = "") -> None:
        self.failed += 1
        line = f"[FAIL] {label}" + (f" — {detail}" if detail else "")
        print(c(RED, "✗") + " " + line)
        self.log_lines.append(line)
        self.failed_endpoints.append(line)
        self.rows.append({"section": section, "label": label, "status": "fail", "detail": detail})

    def warn(self, label: str, detail: str = "", *, section: str = "") -> None:
        self.warned += 1
        line = f"[WARN] {label}" + (f" — {detail}" if detail else "")
        print(c(YELLOW, "!") + " " + line)
        self.log_lines.append(line)
        self.rows.append({"section": section, "label": label, "status": "warn", "detail": detail})

    def skip(self, label: str, detail: str = "", *, section: str = "") -> None:
        self.skipped += 1
        line = f"[SKIP] {label}" + (f" — {detail}" if detail else "")
        print(c(DIM, "·") + " " + line)
        self.log_lines.append(line)
        self.rows.append({"section": section, "label": label, "status": "skip", "detail": detail})

    def info(self, msg: str) -> None:
        print(c(CYAN, "→") + " " + msg)
        self.log_lines.append(f"[INFO] {msg}")

    def header(self, title: str) -> None:
        bar = "─" * 70
        print()
        print(c(BLUE, bar))
        print(c(BOLD + BLUE, f"  {title}"))
        print(c(BLUE, bar))
        self.log_lines.append("")
        self.log_lines.append(f"=== {title} ===")


# ---------------------------------------------------------------------------
# Low-level checks
# ---------------------------------------------------------------------------

def check_dns(hostname: str, timeout: float = 5.0) -> tuple[bool, str]:
    """Resolve a hostname. Returns (ok, detail)."""
    try:
        socket.setdefaulttimeout(timeout)
        addrs = socket.getaddrinfo(hostname, None)
        ips = sorted({a[4][0] for a in addrs})
        return True, ", ".join(ips[:3]) + ("…" if len(ips) > 3 else "")
    except socket.gaierror as e:
        return False, f"DNS resolution failed: {e}"
    except Exception as e:
        return False, f"DNS error: {e}"


def check_tcp(hostname: str, port: int, timeout: float = 5.0) -> tuple[bool, str]:
    """Open a TCP connection. Returns (ok, detail)."""
    try:
        socket.setdefaulttimeout(timeout)
        t0 = time.monotonic()
        with socket.create_connection((hostname, port), timeout=timeout) as s:
            elapsed = (time.monotonic() - t0) * 1000
            return True, f"{int(elapsed)}ms"
    except socket.timeout:
        return False, f"TCP connect timeout ({port})"
    except ConnectionRefusedError:
        return False, f"connection refused ({port})"
    except OSError as e:
        return False, f"TCP error ({port}): {e}"


def check_tls(hostname: str, port: int = 443, timeout: float = 10.0) -> tuple[bool, str]:
    """Complete a TLS handshake. Returns (ok, detail)."""
    ctx = ssl.create_default_context()
    try:
        socket.setdefaulttimeout(timeout)
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cipher = ssock.cipher()[0] if ssock.cipher() else "unknown"
                ver = ssock.version() or "unknown"
                cert = ssock.getpeercert()
                issuer = ""
                if cert and cert.get("issuer"):
                    # cert["issuer"] is a tuple of tuples of (key, value) pairs,
                    # e.g. ((('countryName', 'US'),), (('organizationName', "Let's Encrypt"),), ...)
                    try:
                        for rdn_seq in cert["issuer"]:
                            for attr in rdn_seq:
                                if isinstance(attr, tuple) and len(attr) == 2:
                                    k, v = attr
                                    if k in ("organizationName", "commonName", "O", "CN"):
                                        issuer = v
                                        break
                            if issuer:
                                break
                    except Exception:
                        pass
                return True, f"{ver}, {cipher}, issuer={issuer or 'n/a'}"
    except ssl.SSLCertVerificationError as e:
        return False, f"cert verify failed: {e.verify_message}"
    except ssl.SSLError as e:
        return False, f"SSL error: {e}"
    except socket.timeout:
        return False, "TLS handshake timeout"
    except OSError as e:
        return False, f"TLS error: {e}"


def check_http(url: str, timeout: float = 15.0, method: str = "HEAD",
               verbose: bool = False) -> tuple[bool, str, Optional[int]]:
    """
    Issue an HTTP request and return (ok, detail, status_code).

    HEAD first; if the server disallows HEAD (405), retry with GET but
    stream the body and discard it so we don't download the whole file.
    """
    def _do(m: str) -> tuple[bool, str, Optional[int]]:
        req = urllib.request.Request(url, method=m, headers={
            "User-Agent": f"download-check/{SCRIPT_VERSION} (server capability probe)"
        })
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                code = resp.getcode()
                size = resp.headers.get("Content-Length", "?")
                return True, f"HTTP {code}, len={size}", code
        except urllib.error.HTTPError as e:
            # 4xx/5xx — for our purposes, "reachable but not found" still
            # counts as the host being reachable. We just flag it.
            return (False, f"HTTP {e.code} {e.reason}", e.code)
        except urllib.error.URLError as e:
            reason = getattr(e, "reason", str(e))
            return False, f"URL error: {reason}", None
        except socket.timeout:
            return False, f"timeout after {timeout}s", None
        except Exception as e:
            return False, f"error: {e}", None

    ok, detail, code = _do(method)
    if not ok and code == 405 and method == "HEAD":
        # Retry with GET, streaming so we don't actually download big files.
        ok, detail, code = _do("GET")
    if verbose:
        detail = f"{detail}  [{url}]"
    return ok, detail, code


def check_command(name: str) -> tuple[bool, str]:
    """Is a CLI command on PATH? Returns (ok, path-or-error)."""
    path = shutil.which(name)
    if path:
        # Try to get version
        try:
            r = subprocess.run([name, "--version"], capture_output=True,
                               text=True, timeout=5)
            ver = (r.stdout or r.stderr).strip().split("\n")[0][:60]
            return True, f"{path}  ({ver})"
        except Exception:
            return True, path
    return False, "not on PATH"


def is_npm_package_installed(project_dir: Path, name: str) -> bool:
    """Check if a package is present in node_modules (handles scoped)."""
    candidate = project_dir / "node_modules" / name
    return candidate.is_dir()


# ---------------------------------------------------------------------------
# Higher-level orchestrators
# ---------------------------------------------------------------------------

def check_url_full(url: str, label: str, report: Report, *, section: str,
                   required: bool = True, timeout: float = 15.0,
                   verbose: bool = False, allow_4xx: bool = False) -> bool:
    """
    Full chain: DNS -> TCP -> TLS -> HTTP HEAD.
    Returns True if final HTTP check succeeded.

    If `allow_4xx=True`, a 4xx response is treated as a PASS — useful for
    CDN-style hosts that 404 at the root path but serve real content at
    deep paths (objects.githubusercontent.com, binaries.prisma.sh, etc.).
    """
    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname or ""
    scheme = parsed.scheme
    port = parsed.port or (443 if scheme == "https" else 80)

    # DNS
    dns_ok, dns_detail = check_dns(hostname)
    if not dns_ok:
        if required:
            report.fail(label, f"DNS: {dns_detail}", section=section)
        else:
            report.warn(label, f"DNS: {dns_detail}", section=section)
        return False

    # TCP
    tcp_ok, tcp_detail = check_tcp(hostname, port)
    if not tcp_ok:
        if required:
            report.fail(label, f"TCP {hostname}:{port}: {tcp_detail}", section=section)
        else:
            report.warn(label, f"TCP {hostname}:{port}: {tcp_detail}", section=section)
        return False

    # TLS (only for https)
    if scheme == "https":
        tls_ok, tls_detail = check_tls(hostname, port)
        if not tls_ok:
            if required:
                report.fail(label, f"TLS: {tls_detail}", section=section)
            else:
                report.warn(label, f"TLS: {tls_detail}", section=section)
            return False

    # HTTP
    http_ok, http_detail, code = check_http(url, timeout=timeout, verbose=verbose)
    # If 4xx and allow_4xx is set, treat as reachable.
    if not http_ok and allow_4xx and code is not None and 400 <= code < 500:
        report.pass_(label, f"{dns_detail.split(',')[0]} → {tcp_detail} → HTTP {code} (host reachable, 4xx allowed)",
                     section=section)
        return True
    if http_ok:
        report.pass_(label, f"{dns_detail.split(',')[0]} → {tcp_detail} → {http_detail}",
                     section=section)
    else:
        if required:
            report.fail(label, http_detail, section=section)
        else:
            report.warn(label, http_detail, section=section)
    return http_ok


# ---------------------------------------------------------------------------
# Section runners
# ---------------------------------------------------------------------------

def section_system_info(report: Report, project_dir: Path) -> None:
    report.header("Section 1 — System information")

    def human_bytes(n: int) -> str:
        for unit in ("B", "KB", "MB", "GB", "TB", "PB"):
            if n < 1024:
                return f"{n:.1f} {unit}"
            n /= 1024
        return f"{n:.1f} EB"

    # OS / kernel
    print(f"  OS              : {platform.system()} {platform.release()} ({platform.machine()})")
    print(f"  Python          : {platform.python_version()}")
    print(f"  Architecture    : {platform.machine()}")
    print(f"  Processor       : {platform.processor() or 'n/a'}")
    try:
        with open("/etc/os-release") as f:
            osrelease = {}
            for line in f:
                if "=" in line:
                    k, v = line.strip().split("=", 1)
                    osrelease[k] = v.strip('"')
        print(f"  Distro          : {osrelease.get('PRETTY_NAME', 'unknown')}")
        print(f"  Distro ID       : {osrelease.get('ID', 'unknown')}  (family: {osrelease.get('ID_LIKE', 'n/a')})")
        report.pass_("OS detection", osrelease.get('PRETTY_NAME', 'unknown'), section="system")
    except Exception:
        report.warn("OS detection", "could not read /etc/os-release", section="system")

    # Memory
    try:
        with open("/proc/meminfo") as f:
            meminfo = {}
            for line in f:
                k, _, v = line.partition(":")
                meminfo[k.strip()] = int(v.strip().split()[0]) * 1024
        total = meminfo.get("MemTotal", 0)
        avail = meminfo.get("MemAvailable", 0)
        print(f"  Memory          : {human_bytes(avail)} available / {human_bytes(total)} total")
        if avail < 512 * 1024 * 1024:
            report.warn("Memory", f"low available RAM: {human_bytes(avail)} (<512 MB may break builds)", section="system")
        else:
            report.pass_("Memory", f"{human_bytes(avail)} available", section="system")
    except Exception:
        report.warn("Memory", "/proc/meminfo not readable", section="system")

    # Disk space
    try:
        stat = os.statvfs(project_dir)
        free = stat.f_bavail * stat.f_frsize
        print(f"  Disk free       : {human_bytes(free)} in {project_dir}")
        if free < 2 * 1024 * 1024 * 1024:
            report.fail("Disk space", f"only {human_bytes(free)} free (need >= 2 GB for npm install + build)",
                        section="system")
        elif free < 5 * 1024 * 1024 * 1024:
            report.warn("Disk space", f"only {human_bytes(free)} free (>=5 GB recommended for build cache + sharp + prisma)",
                        section="system")
        else:
            report.pass_("Disk space", f"{human_bytes(free)} free", section="system")
    except Exception as e:
        report.warn("Disk space", f"statvfs failed: {e}", section="system")


def section_required_cli(report: Report) -> dict[str, str]:
    report.header("Section 2 — Required CLI tools")
    versions: dict[str, str] = {}
    for cmd, required, hint in REQUIRED_CLI:
        ok, detail = check_command(cmd)
        if ok:
            report.pass_(cmd, detail, section="cli")
            versions[cmd] = detail
        elif required:
            report.fail(cmd, f"not found — install: {hint}", section="cli")
        else:
            report.warn(cmd, f"not found — install: {hint}", section="cli")
    return versions


def detect_package_manager() -> str:
    for pm in ("apt", "dnf", "yum", "apk", "zypper", "pacman"):
        if shutil.which(pm):
            return pm
    return ""


def section_system_mirrors(report: Report) -> None:
    report.header("Section 3 — System package mirrors")
    pm = detect_package_manager()
    if not pm:
        report.warn("Package manager", "no apt/dnf/yum/apk/zypper/pacman detected", section="mirrors")
        return
    report.pass_("Detected package manager", pm, section="mirrors")

    if pm == "apt":
        mirrors = APT_MIRRORS
    elif pm in ("dnf", "yum"):
        mirrors = YUM_MIRRORS
    else:
        report.info(f"Skipping mirror probe for {pm} (no default mirror list)")
        return

    for url in mirrors:
        check_url_full(url, f"mirror {url}", report, section="mirrors",
                       required=False, timeout=10.0)


def section_core_infra(report: Report, verbose: bool, timeout: float) -> None:
    report.header("Section 4 — Core registries & infrastructure")
    for url, label, required, allow_4xx in INFRA_ENDPOINTS:
        check_url_full(url, label, report, section="infra",
                       required=required, timeout=timeout, verbose=verbose,
                       allow_4xx=allow_4xx)


def section_package_binaries(report: Report, verbose: bool, timeout: float,
                             prisma_version: str, sharp_version: str) -> None:
    report.header("Section 5 — Package-specific binary sources")

    # ---- Prisma engines --------------------------------------------------
    # Prisma fetches query engine binaries from binaries.prisma.sh.
    # Without the exact commit hash we just probe the host root + a
    # well-known path shape. A 404 is fine — it means the host is
    # reachable, which is what we care about.
    report.info("Prisma: probing binaries.prisma.sh (Prisma fetches query-engine binaries here)")
    # Probe with a fake but well-formed path; expect 404 (reachable) not DNS/conn error
    prisma_probe = "https://binaries.prisma.sh/all_commits/0000000000000000000000000000000000000000/linux-x64-devel/query-engine"
    ok, detail, code = check_http(prisma_probe, timeout=timeout, verbose=verbose)
    # 403/404 is fine; only connection-level failure counts as fail
    if ok or code in (403, 404, 400):
        report.pass_("Prisma engines mirror", f"reachable (HTTP {code})", section="binaries")
    else:
        report.fail("Prisma engines mirror", detail, section="binaries")
        report.info("  workaround: set PRISMA_ENGINES_MIRROR to a local mirror, or vendor the engines")

    # Also check the Prisma CLI's npm tarball specifically (it has a postinstall
    # that downloads engines)
    check_url_full(f"https://registry.npmjs.org/prisma/-/prisma-{prisma_version}.tgz",
                   f"Prisma CLI tarball v{prisma_version}", report,
                   section="binaries", required=True, timeout=timeout, verbose=verbose)

    # ---- sharp libvips ---------------------------------------------------
    # sharp's install pulls a prebuilt libvips tarball from a GitHub release.
    # Without the exact version we probe the repo's releases page.
    report.info("sharp: probing sharp-libvips-linux-x64 GitHub release asset host")
    sharp_probe = "https://github.com/lovell/sharp-libvips-linux-x64/releases/download/v0.0.0/linux-x64.tar.gz"
    ok, detail, code = check_http(sharp_probe, timeout=timeout, verbose=verbose)
    if ok or code in (404,):
        report.pass_("sharp libvips releases", f"reachable (HTTP {code})", section="binaries")
    else:
        report.fail("sharp libvips releases", detail, section="binaries")
        report.info("  workaround: vendor the libvips tarball and set SHARP_DIST_BASE_URL locally")

    # ---- SWC platform packages (used by Next.js) -------------------------
    # @swc/core downloads a platform-specific binary on install via its
    # postinstall. They live on npm under scoped names like
    # @swc/core-linux-x64-gnu.
    arch = platform.machine()
    swc_suffix = {
        "x86_64":  "linux-x64-gnu",
        "amd64":   "linux-x64-gnu",
        "aarch64": "linux-arm64-gnu",
        "arm64":   "linux-arm64-gnu",
    }.get(arch, "linux-x64-gnu")
    swc_pkg = f"@swc/core-{swc_suffix}"
    check_url_full(f"https://registry.npmjs.org/{urllib.parse.quote(swc_pkg)}",
                   f"SWC platform package ({swc_pkg})",
                   report, section="binaries", required=True, timeout=timeout, verbose=verbose)

    # ---- esbuild platform package ---------------------------------------
    esbuild_pkg = f"@esbuild/linux-x64" if arch in ("x86_64", "amd64") else f"@esbuild/linux-arm64"
    check_url_full(f"https://registry.npmjs.org/{urllib.parse.quote(esbuild_pkg)}",
                   f"esbuild platform package ({esbuild_pkg})",
                   report, section="binaries", required=False, timeout=timeout, verbose=verbose)

    # ---- lightningcss (Tailwind v4 uses it) ------------------------------
    lc_pkg = f"lightningcss-linux-x64-gnu" if arch in ("x86_64", "amd64") else "lightningcss-linux-arm64-gnu"
    check_url_full(f"https://registry.npmjs.org/{urllib.parse.quote(lc_pkg)}",
                   f"lightningcss platform package ({lc_pkg})",
                   report, section="binaries", required=False, timeout=timeout, verbose=verbose)


def section_npm_deps(report: Report, project_dir: Path, verbose: bool,
                     timeout: float, threads: int) -> None:
    report.header("Section 6 — All npm dependencies (metadata + tarball + installed?)")

    pkg_json_path = project_dir / "package.json"
    if not pkg_json_path.is_file():
        report.fail("package.json", f"not found at {pkg_json_path}", section="npm")
        return

    try:
        pkg = json.loads(pkg_json_path.read_text(encoding="utf-8"))
    except Exception as e:
        report.fail("package.json", f"could not parse: {e}", section="npm")
        return

    deps: dict[str, str] = {}
    deps.update(pkg.get("dependencies", {}) or {})
    deps.update(pkg.get("devDependencies", {}) or {})
    deps.update(pkg.get("optionalDependencies", {}) or {})
    deps.update(pkg.get("peerDependencies", {}) or {})

    if not deps:
        report.warn("package.json", "no dependencies declared", section="npm")
        return

    report.info(f"Found {len(deps)} dependencies in package.json — checking each (parallel x{threads})")

    # Git / URL deps
    git_deps = [(n, v) for n, v in deps.items()
                if isinstance(v, str) and (v.startswith("git+") or v.startswith("https://")
                                            or v.startswith("file:"))]
    plain_deps = [(n, v) for n, v in deps.items() if (n, v) not in git_deps]

    def check_one(name: str, version_spec: str) -> dict:
        # 1. Already installed?
        installed = is_npm_package_installed(project_dir, name)
        # 2. Metadata URL — registry.npmjs.org/<name> (URL-encoded for scoped)
        meta_url = f"https://registry.npmjs.org/{urllib.parse.quote(name)}"
        meta_ok, meta_detail, _ = check_http(meta_url, timeout=timeout, verbose=False)
        # 3. Tarball URL — we need a concrete version. If the spec is a
        # bare version like ^6.11.1, strip the leading ^/~ and try that.
        # For * or latest, skip tarball check.
        tarball_status = "skip"
        tarball_detail = "version spec is range/latest"
        bare = version_spec.lstrip("^~>=< ")
        if bare and not bare.startswith("file:") and not bare.startswith("git+") \
           and not bare.startswith("http") and bare not in ("*", "latest", "next"):
            tarball_url = f"https://registry.npmjs.org/{urllib.parse.quote(name)}/-/{name.replace('@','')}-{bare}.tgz"
            # scoped packages: tarball URL uses the unscoped name
            if name.startswith("@") and "/" in name:
                short = name.split("/", 1)[1]
                tarball_url = f"https://registry.npmjs.org/{urllib.parse.quote(name)}/-/{short}-{bare}.tgz"
            t_ok, t_detail, t_code = check_http(tarball_url, timeout=timeout, verbose=False)
            if t_ok:
                tarball_status = "pass"
                tarball_detail = f"HTTP {t_code}"
            elif t_code in (404,):
                # Version doesn't exist (e.g. we guessed wrong on a range).
                # The metadata call is the source of truth — if that
                # passed, the package is fetchable.
                if meta_ok:
                    tarball_status = "pass"
                    tarball_detail = "tarball 404 for guessed version, metadata OK"
                else:
                    tarball_status = "fail"
                    tarball_detail = t_detail
            else:
                tarball_status = "fail"
                tarball_detail = t_detail
        return {
            "name": name,
            "spec": version_spec,
            "installed": installed,
            "meta_ok": meta_ok,
            "meta_detail": meta_detail,
            "tarball_status": tarball_status,
            "tarball_detail": tarball_detail,
        }

    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=threads) as ex:
        futures = {ex.submit(check_one, n, v): n for n, v in plain_deps}
        for fut in as_completed(futures):
            try:
                results.append(fut.result())
            except Exception as e:
                report.fail(futures[fut], f"check raised: {e}", section="npm")

    # Sort for stable output
    results.sort(key=lambda r: r["name"].lower())

    for r in results:
        name = r["name"]
        # Decide overall status
        meta_ok = r["meta_ok"]
        tar_ok = r["tarball_status"] == "pass"
        installed = r["installed"]

        # Detail string
        flags = []
        flags.append("installed" if installed else "not installed")
        flags.append("meta " + ("OK" if meta_ok else "FAIL"))
        if r["tarball_status"] != "skip":
            flags.append("tarball " + ("OK" if tar_ok else "FAIL"))
        else:
            flags.append("tarball n/a")
        detail = " | ".join(flags)

        if meta_ok and tar_ok:
            if installed:
                report.pass_(name, detail + " (already in node_modules)", section="npm")
            else:
                report.pass_(name, detail, section="npm")
        elif meta_ok and not tar_ok:
            report.warn(name, detail + " — metadata OK but guessed tarball not reachable", section="npm")
        else:
            report.fail(name, detail, section="npm")

    # Git / non-npm deps
    for name, spec in git_deps:
        report.warn(name, f"non-npm dependency: {spec} — checked separately", section="npm")
        if spec.startswith("git+") or spec.startswith("https://github.com"):
            # Try to extract a URL
            url = spec[4:] if spec.startswith("git+") else spec
            url = url.split("#")[0].replace("ssh://git@", "https://")
            if url.startswith("https://"):
                check_url_full(url, f"git dep {name}", report, section="npm",
                               required=True, timeout=timeout, verbose=verbose)


def section_dns_sweep(report: Report) -> None:
    """Resolve every hostname we touched."""
    report.header("Section 7 — DNS resolution sweep")
    hostnames = sorted({
        urllib.parse.urlparse(url).hostname
        for url, _, _, _ in INFRA_ENDPOINTS
        if urllib.parse.urlparse(url).hostname
    } | {
        "registry.npmjs.org",
        "binaries.prisma.sh",
        "github.com",
        "codeload.github.com",
        "objects.githubusercontent.com",
        "raw.githubusercontent.com",
        "nodejs.org",
        "bun.sh",
        "pypi.org",
        "jsr.io",
    })
    for h in hostnames:
        ok, detail = check_dns(h)
        if ok:
            report.pass_(h, detail, section="dns")
        else:
            report.fail(h, detail, section="dns")


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

RECOMMENDATIONS = [
    "If binaries.prisma.sh is blocked: set PRISMA_ENGINES_MIRROR=https://your-mirror/ "
    "or vendor the engine binary and set PRISMA_QUERY_ENGINE_BINARY=/path/to/engine.",

    "If sharp's libvips GitHub release is blocked: pre-download the linux-x64.tar.gz, "
    "place it in ~/.npm/_libvips, and set SHARP_IGNORE_GLOBAL_LIBVIPS=1.",

    "If GitHub is blocked entirely: npm install will fail for any package whose "
    "postinstall pulls from GitHub (sharp, esbuild, swc). Vendor those binaries "
    "or use an internal npm mirror (Verdaccio / Nexus / Artifactory).",

    "If registry.npmjs.org is blocked: configure a private registry in .npmrc — "
    "  registry=https://your-internal-registry/ — and mirror the packages there.",

    "If TLS handshake fails for a known-good host (e.g. github.com): the server's "
    "CA bundle is probably outdated. Run: apt-get install --reinstall ca-certificates "
    "  (or: dnf reinstall ca-certificates) and update-ssl-cert / update-ca-trust.",

    "If DNS fails for a hostname that should resolve: check /etc/resolv.conf and "
    "consider switching to 1.1.1.1 or 8.8.8.8 as a fallback resolver.",

    "For Prisma specifically: prisma generate runs at install time and needs to "
    "fetch the query engine. If the server is offline at build time, run "
    "prisma generate on a build machine and copy node_modules/.prisma/client/ "
    "along with the build artifacts.",

    "If nginx is not installed: install it via apt/dnf AFTER the build is done. "
    "nginx itself does not block npm install or next build.",
]


def print_summary(report: Report, project_dir: Path, elapsed: float) -> int:
    report.header("Summary")

    total = report.passed + report.failed + report.warned + report.skipped
    print()
    print(f"  Project dir     : {project_dir}")
    print(f"  Elapsed         : {elapsed:.1f}s")
    print(f"  Total checks    : {total}")
    print(f"  {c(GREEN, 'Passed')}      : {report.passed}")
    print(f"  {c(RED,   'Failed')}      : {report.failed}")
    print(f"  {c(YELLOW,'Warned')}      : {report.warned}")
    print(f"  {c(DIM,   'Skipped')}      : {report.skipped}")

    if report.failed_endpoints:
        print()
        print(c(RED + BOLD, "  Failed checks:"))
        for line in report.failed_endpoints:
            print(f"    {c(RED, '•')} {line}")

    print()
    print(c(BOLD, "  Recommendations if any required check failed:"))
    for r in RECOMMENDATIONS:
        print(f"    {c(CYAN, '→')} {r}")

    print()
    if report.failed == 0:
        print(c(GREEN + BOLD, "  ✓ Server can download everything required."))
        return 0
    else:
        print(c(RED + BOLD, f"  ✗ {report.failed} required check(s) failed. See above."))
        return 1


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Test whether this server can download all the project's dependencies.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Exit code 0 = all required checks passed; 1 = some failed; 2 = script error.",
    )
    parser.add_argument("--project-dir", default=".",
                        help="Path to the project root (containing package.json). Default: .")
    parser.add_argument("--timeout", type=float, default=15.0,
                        help="Per-request timeout in seconds. Default: 15")
    parser.add_argument("--threads", type=int, default=8,
                        help="Parallel workers for npm package checks. Default: 8")
    parser.add_argument("--verbose", action="store_true",
                        help="Include URLs in check details.")
    parser.add_argument("--json", action="store_true",
                        help="Emit machine-readable JSON instead of human output.")
    parser.add_argument("--no-log", action="store_true",
                        help="Do not write a .log file alongside the script.")
    args = parser.parse_args()

    project_dir = Path(args.project_dir).resolve()
    if not project_dir.is_dir():
        print(f"error: project dir not found: {project_dir}", file=sys.stderr)
        return 2

    pkg_json = project_dir / "package.json"
    if not pkg_json.is_file():
        print(f"error: package.json not found in {project_dir}", file=sys.stderr)
        return 2

    # Resolve versions we care about
    try:
        pkg = json.loads(pkg_json.read_text(encoding="utf-8"))
        prisma_version = (pkg.get("dependencies", {}) or {}).get("prisma", "6.11.1").lstrip("^~")
        sharp_version = (pkg.get("dependencies", {}) or {}).get("sharp", "0.34.3").lstrip("^~")
    except Exception:
        prisma_version = "6.11.1"
        sharp_version = "0.34.3"

    report = Report()
    t0 = time.monotonic()

    if args.json:
        # In JSON mode we still run everything but suppress human print
        import io
        from contextlib import redirect_stdout
        buf = io.StringIO()
        with redirect_stdout(buf):
            section_system_info(report, project_dir)
            section_required_cli(report)
            section_system_mirrors(report)
            section_core_infra(report, args.verbose, args.timeout)
            section_package_binaries(report, args.verbose, args.timeout,
                                     prisma_version, sharp_version)
            section_npm_deps(report, project_dir, args.verbose, args.timeout, args.threads)
            section_dns_sweep(report)
        print(json.dumps({
            "version": SCRIPT_VERSION,
            "project_dir": str(project_dir),
            "timestamp": datetime.now().isoformat(),
            "elapsed_seconds": round(time.monotonic() - t0, 2),
            "summary": {
                "passed": report.passed,
                "failed": report.failed,
                "warned": report.warned,
                "skipped": report.skipped,
            },
            "checks": report.rows,
        }, indent=2, ensure_ascii=False))
        return 0 if report.failed == 0 else 1

    # Human mode
    print(c(BOLD + CYAN, f"\n  Download Capability Check  v{SCRIPT_VERSION}"))
    print(c(CYAN, f"  Project: {project_dir}"))
    print(c(CYAN, f"  Started: {datetime.now().isoformat()}"))
    print()

    section_system_info(report, project_dir)
    section_required_cli(report)
    section_system_mirrors(report)
    section_core_infra(report, args.verbose, args.timeout)
    section_package_binaries(report, args.verbose, args.timeout,
                             prisma_version, sharp_version)
    section_npm_deps(report, project_dir, args.verbose, args.timeout, args.threads)
    section_dns_sweep(report)

    elapsed = time.monotonic() - t0
    rc = print_summary(report, project_dir, elapsed)

    # Save log file
    if not args.no_log:
        log_path = project_dir / f"download-check-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log"
        try:
            log_path.write_text(
                f"Download Capability Check v{SCRIPT_VERSION}\n"
                f"Project: {project_dir}\n"
                f"Timestamp: {datetime.now().isoformat()}\n"
                f"Elapsed: {elapsed:.1f}s\n"
                f"Passed: {report.passed}  Failed: {report.failed}  "
                f"Warned: {report.warned}  Skipped: {report.skipped}\n"
                + "\n".join(report.log_lines)
                + "\n\nFailed endpoints:\n"
                + ("\n".join(report.failed_endpoints) or "  (none)\n"),
                encoding="utf-8"
            )
            print(c(DIM, f"\n  Log saved to: {log_path}"))
        except Exception as e:
            print(c(YELLOW, f"\n  Could not save log: {e}"), file=sys.stderr)

    return rc


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        sys.exit(130)
