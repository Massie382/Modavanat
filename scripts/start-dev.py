#!/usr/bin/env python3
"""
Daemon launcher for Next.js dev server.
Uses double-fork technique to fully detach from the calling shell's
process group / session, so the server survives after the Bash tool
call that started it returns.
"""
import os
import sys
import time
import subprocess
import signal
from pathlib import Path

PROJECT_DIR = Path("/home/z/my-project")
LOG_FILE = PROJECT_DIR / "dev.log"
PID_FILE = Path("/tmp/nextdev.pid")
PORT = 3000


def is_running(pid):
    """Check if a process with this PID is alive."""
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False


def check_port():
    """Check if port is already serving HTTP 200."""
    try:
        import urllib.request
        r = urllib.request.urlopen(f"http://localhost:{PORT}/", timeout=2)
        return r.status in (200, 304)
    except Exception:
        return False


def daemonize():
    """Double-fork to detach from controlling terminal and shell session."""
    # First fork
    pid = os.fork()
    if pid > 0:
        # Parent exits immediately
        return None  # caller returns to shell

    # Child: create new session
    os.setsid()

    # Second fork (prevents reacquiring controlling terminal)
    pid = os.fork()
    if pid > 0:
        os._exit(0)

    # Grandchild becomes the daemon
    os.chdir(str(PROJECT_DIR))
    os.umask(0)

    # Redirect stdin/stdout/stderr to log file
    sys.stdout.flush()
    sys.stderr.flush()
    fd_in = os.open(os.devnull, os.O_RDONLY)
    fd_out = os.open(str(LOG_FILE), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    fd_err = os.dup(fd_out)
    os.dup2(fd_in, 0)
    os.dup2(fd_out, 1)
    os.dup2(fd_err, 2)

    return os.getpid()


def start_server():
    """Start the Next.js dev server as a daemon."""
    # Check if already running
    if PID_FILE.exists():
        old_pid = int(PID_FILE.read_text().strip())
        if is_running(old_pid):
            # Check if it's responding
            if check_port():
                print(f"Server already running (PID {old_pid}), port {PORT} responding.", flush=True)
                return True
            else:
                print(f"PID {old_pid} alive but not responding, killing...", flush=True)
                os.kill(old_pid, signal.SIGTERM)
                time.sleep(2)

    mode = os.environ.get("SERVER_MODE", "dev")
    label = "production server" if mode == "prod" else "dev server"
    print(f"Starting Next.js {label} as daemon...", flush=True)

    # Open log file for the daemon's stdout/stderr
    log_fd = os.open(str(LOG_FILE), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)

    # Fork off
    pid = os.fork()
    if pid > 0:
        # Parent: wait briefly for child to fork again and write PID
        time.sleep(1)
        # Read the PID file written by the grandchild
        if PID_FILE.exists():
            actual_pid = PID_FILE.read_text().strip()
            print(f"Daemon launched, PID: {actual_pid}", flush=True)
        return True

    # Child: decouple from parent
    os.setsid()

    # Second fork
    pid = os.fork()
    if pid > 0:
        # Write the grandchild's PID to file before exiting
        PID_FILE.write_text(str(pid))
        os._exit(0)

    # Grandchild: this is the daemon
    os.chdir(str(PROJECT_DIR))
    os.umask(0)

    # Close stdin, redirect stdout/stderr to log
    sys.stdout.flush()
    sys.stderr.flush()
    devnull_fd = os.open(os.devnull, os.O_RDONLY)
    os.dup2(devnull_fd, 0)
    os.dup2(log_fd, 1)
    os.dup2(log_fd, 2)
    os.close(devnull_fd)
    if log_fd > 2:
        os.close(log_fd)

    # Exec next dev or production server (replaces this process)
    mode = os.environ.get("SERVER_MODE", "dev")
    if mode == "prod":
        os.execvp("node", ["node", ".next/standalone/server.js"])
    else:
        os.execvp("npx", ["npx", "next", "dev", "-p", str(PORT)])
    # Should never reach here
    os._exit(1)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "start"
    if cmd == "start":
        if start_server():
            # Give it a few seconds to start
            for i in range(20):
                time.sleep(1)
                if check_port():
                    print(f"Server responding on port {PORT} after {i+1}s", flush=True)
                    sys.exit(0)
            print("Server started but not responding yet (may still be compiling)", flush=True)
            sys.exit(0)
        else:
            print("Failed to start server", flush=True)
            sys.exit(1)
    elif cmd == "status":
        if PID_FILE.exists():
            pid = int(PID_FILE.read_text().strip())
            alive = is_running(pid)
            responding = check_port()
            print(f"PID: {pid}, alive: {alive}, responding: {responding}", flush=True)
        else:
            print("No PID file", flush=True)
    elif cmd == "stop":
        if PID_FILE.exists():
            pid = int(PID_FILE.read_text().strip())
            if is_running(pid):
                os.kill(pid, signal.SIGTERM)
                print(f"Sent SIGTERM to {pid}", flush=True)
            PID_FILE.unlink()
