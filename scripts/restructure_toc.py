#!/usr/bin/env python3
"""Restructure the TOC arrays in src/data/laws.ts to follow the
4-level hierarchy کتاب → فصل → باب → مبحث (book → chapter → section → topic)
with no individual article leaves at the bottom.

Reads the file, finds each law's `toc: [...]` array (delimited by
the start line `  toc: [` and the matching `  ],\n` end), and replaces
it with a freshly-built 4-level structure. مبحث leaves carry an
`articleIds` field that lists the article IDs that belong to that
topic — the renderer uses this to filter the Content tab.
"""

import re
from pathlib import Path

PATH = Path("/home/z/my-project/src/data/laws.ts")


def render_node(node, depth):
    """Render a TOC node as a multi-line TS literal. Children can be:
       - list of tuples  → nested children (branch)
       - list of strings  → leaf with articleIds
       - empty list       → leaf with empty articleIds
    Trailing commas are always added — JS/TS allows them.
    """
    pad = "  " * depth
    nid, label, title, ntype, children = node
    lines = [f'{pad}{{']
    lines.append(f'{pad}  id: "{nid}",')
    lines.append(f'{pad}  label: "{label}",')
    lines.append(f'{pad}  title: "{title}",')
    lines.append(f'{pad}  type: "{ntype}",')
    if isinstance(children, list) and children and isinstance(children[0], tuple):
        lines.append(f'{pad}  children: [')
        for child in children:
            lines.append(render_node(child, depth + 2))
        lines.append(f'{pad}  ],')
    elif isinstance(children, list) and all(isinstance(x, str) for x in children):
        if children:
            ids_str = ", ".join(f'"{a}"' for a in children)
            lines.append(f'{pad}  articleIds: [{ids_str}],')
        else:
            lines.append(f'{pad}  articleIds: [],')
    else:
        lines.append(f'{pad}  articleIds: [],')
    lines.append(f'{pad}}},')
    return "\n".join(lines)


def build_toc_body(structure):
    """Build just the array items (without the `  toc: [` header and without
    the trailing `],` close). The caller wraps it."""
    return "\n".join(render_node(node, 2) for node in structure)


# --- Qanoon Madani (قانون مدنی) ---
madani_toc = [
    ("qm-book-1", "کتاب اول", "اموال", "book", [
        ("qm-c1", "فصل اول", "مقدمه", "chapter", [
            ("qm-s1", "باب اول", "کلیات", "section", [
                ("qm-t1", "مبحث نخست", "نافذ بودن و اجرای قانون", "topic", ["qm-a1", "qm-a2", "qm-a3"]),
            ]),
        ]),
        ("qm-c2", "فصل دوم", "احکام اموال", "chapter", [
            ("qm-s2", "باب اول", "اقرار", "section", [
                ("qm-t2", "مبحث نخست", "ماهیت و شرایط اقرار", "topic", ["qm-a10", "qm-a11", "qm-a12", "qm-a13", "qm-a14"]),
            ]),
        ]),
    ]),
    ("qm-book-2", "کتاب دوم", "خانواده", "book", [
        ("qm-c3", "فصل اول", "در عقد نکاح", "chapter", [
            ("qm-s3", "باب اول", "مقررات عمومی نکاح", "section", [
                ("qm-t3", "مبحث نخست", "صیغه و شرایط نکاح", "topic", ["qm-a1062", "qm-a1065"]),
                ("qm-t4", "مبحث دوم", "مهریه", "topic", ["qm-a1082"]),
                ("qm-t5", "مبحث سوم", "طلاق و وکالت در طلاق", "topic", ["qm-a1133"]),
            ]),
        ]),
    ]),
    ("qm-book-3", "کتاب سوم", "ادله اثبات دعوی", "book", [
        ("qm-c4", "فصل اول", "اقرار", "chapter", [
            ("qm-s4", "باب اول", "احکام اقرار", "section", [
                ("qm-t6", "مبحث نخست", "شرایط شنود اقرار", "topic", ["qm-a1275"]),
            ]),
            ("qm-s5", "باب دوم", "بینه و شهادت", "section", [
                ("qm-t7", "مبحث نخست", "تعریف بینه", "topic", ["qm-a1284"]),
            ]),
        ]),
    ]),
]

# --- Qanoon Majazat (قانون مجازات اسلامی) ---
majazat_toc = [
    ("qmi-book-1", "کتاب اول", "کلیات", "book", [
        ("qmi-c1", "فصل اول", "مقدمه و تعاریف", "chapter", [
            ("qmi-s1", "باب اول", "مفاهیم پایه", "section", [
                ("qmi-t1", "مبحث نخست", "مفهوم قانون کیفری", "topic", ["qmi-a1", "qmi-a2"]),
                ("qmi-t2", "مبحث دوم", "عمد و قصد", "topic", ["qmi-a14", "qmi-a18"]),
                ("qmi-t3", "مبحث سوم", "تناسب جرم و مجازات", "topic", ["qmi-a38"]),
            ]),
        ]),
        ("qmi-c2", "فصل دوم", "مسئولیت کیفری", "chapter", [
            ("qmi-s2", "باب اول", "عوامل رافع مسئولیت", "section", [
                ("qmi-t4", "مبحث نخست", "سازمان مجرمانه", "topic", ["qmi-a100"]),
                ("qmi-t5", "مبحث دوم", "اکراه و اجبار", "topic", ["qmi-a145"]),
            ]),
        ]),
    ]),
    ("qmi-book-2", "کتاب دوم", "حدود", "book", [
        ("qmi-c3", "فصل اول", "مقررات عمومی حدود", "chapter", [
            ("qmi-s3", "باب اول", "احکام عمومی", "section", [
                ("qmi-t6", "مبحث نخست", "تعاریف و دامنه", "topic", []),
            ]),
        ]),
    ]),
    ("qmi-book-3", "کتاب سوم", "قصاص", "book", [
        ("qmi-c4", "فصل اول", "قصاص نفس", "chapter", [
            ("qmi-s4", "باب اول", "شرایط قصاص", "section", [
                ("qmi-t7", "مبحث نخست", "قیود قصاص", "topic", ["qmi-a345"]),
            ]),
        ]),
    ]),
    ("qmi-book-4", "کتاب چهارم", "دیات", "book", [
        ("qmi-c5", "فصل اول", "احکام عمومی دیات", "chapter", [
            ("qmi-s5", "باب اول", "تعریف و اقسام", "section", [
                ("qmi-t8", "مبحث نخست", "مفهوم دیه", "topic", ["qmi-a500"]),
            ]),
        ]),
    ]),
]

# --- Qanoon Tejarat (قانون تجارت) ---
# Old labels used "بخش اول/دوم/سوم" — rename to "کتاب اول/دوم/سوم".
tejarat_toc = [
    ("qt-book-1", "کتاب اول", "در تجارت و کنش‌های تجاری", "book", [
        ("qt-c1", "فصل اول", "کنش‌های تجاری", "chapter", [
            ("qt-s1", "باب اول", "معاملات تجاری", "section", [
                ("qt-t1", "مبحث نخست", "تعریف معاملات تجاری", "topic", ["qt-a1", "qt-a2", "qt-a3"]),
                ("qt-t2", "مبحث دوم", "دفاتر تجاری", "topic", ["qt-a5"]),
            ]),
        ]),
    ]),
    ("qt-book-2", "کتاب دوم", "در شرکت‌های تجاری", "book", [
        ("qt-c2", "فصل اول", "اقسام شرکت‌های تجاری", "chapter", [
            ("qt-s2", "باب اول", "شرکت‌های تجاری", "section", [
                ("qt-t3", "مبحث نخست", "تعریف شرکت‌های تجاری", "topic", ["qt-a20"]),
                ("qt-t4", "مبحث دوم", "شرکت سهامی", "topic", ["qt-a55"]),
            ]),
        ]),
    ]),
    ("qt-book-3", "کتاب سوم", "در اسناد تجاری", "book", [
        ("qt-c3", "فصل اول", "برات", "chapter", [
            ("qt-s3", "باب اول", "احکام برات", "section", [
                ("qt-t5", "مبحث نخست", "تعریف برات", "topic", ["qt-a223"]),
            ]),
        ]),
    ]),
]

# --- Qanoon Kar (قانون کار) ---
# Old labels used "بخش اول/دوم/سوم/چهارم" — rename to "کتاب اول/دوم/سوم/چهارم".
kar_toc = [
    ("qk-book-1", "کتاب اول", "کلیات", "book", [
        ("qk-c1", "فصل اول", "مقدمه و دامنه", "chapter", [
            ("qk-s1", "باب اول", "تعاریف", "section", [
                ("qk-t1", "مبحث نخست", "هدف قانون", "topic", ["qk-a1"]),
                ("qk-t2", "مبحث دوم", "دامنه کاربرد", "topic", ["qk-a2"]),
                ("qk-t3", "مبحث سوم", "تعریف کارگر", "topic", ["qk-a3"]),
            ]),
        ]),
    ]),
    ("qk-book-2", "کتاب دوم", "قرارداد کار", "book", [
        ("qk-c2", "فصل اول", "انعقاد و اقسام قرارداد", "chapter", [
            ("qk-s2", "باب اول", "انعقاد قرارداد", "section", [
                ("qk-t4", "مبحث نخست", "تعریف قرارداد کار", "topic", ["qk-a10"]),
                ("qk-t5", "مبحث دوم", "اقسام قرارداد", "topic", ["qk-a11"]),
            ]),
        ]),
    ]),
    ("qk-book-3", "کتاب سوم", "ساعات کار، مرخصی و تعطیلات", "book", [
        ("qk-c3", "فصل اول", "ساعات کار", "chapter", [
            ("qk-s3", "باب اول", "حداکثر ساعات کار", "section", [
                ("qk-t6", "مبحث نخست", "سقف ساعات کار هفتگی", "topic", ["qk-a51"]),
            ]),
        ]),
        ("qk-c4", "فصل دوم", "مرخصی", "chapter", [
            ("qk-s4", "باب اول", "مرخصی استحقاقی", "section", [
                ("qk-t7", "مبحث نخست", "حق مرخصی", "topic", ["qk-a62"]),
            ]),
        ]),
    ]),
    ("qk-book-4", "کتاب چهارم", "دستمزد و مزایا", "book", [
        ("qk-c5", "فصل اول", "حداقل دستمزد", "chapter", [
            ("qk-s5", "باب اول", "تعیین حداقل مزد", "section", [
                ("qk-t8", "مبحث نخست", "حداقل مزد", "topic", ["qk-a138"]),
            ]),
        ]),
        ("qk-c6", "فصل دوم", "ساعات اضافه‌کاری", "chapter", [
            ("qk-s6", "باب اول", "احکام اضافه‌کاری", "section", [
                ("qk-t9", "مبحث نخست", "شرایط کار اضافه", "topic", ["qk-a142"]),
            ]),
        ]),
    ]),
]

# --- Qanoon Asasi (قانون اساسی) ---
# Top-level is فصل (no کتاب in the actual law). For renderer flexibility
# we keep فصل at the top and use باب → مبحث under it.
asasi_toc = [
    ("qa-c1", "فصل اول", "اصول کلی", "chapter", [
        ("qa-s1", "باب اول", "حاکمیت و نظام سیاسی", "section", [
            ("qa-t1", "مبحث نخست", "حاکمیت ملی و جمهوری اسلامی", "topic", ["qa-a1", "qa-a2", "qa-a4"]),
        ]),
    ]),
    ("qa-c2", "فصل سوم", "حقوق ملت", "chapter", [
        ("qa-s2", "باب اول", "برابری و آزادی‌ها", "section", [
            ("qa-t2", "مبحث نخست", "برابری و حقوق بنیادین", "topic", ["qa-a19", "qa-a20"]),
        ]),
    ]),
    ("qa-c3", "فصل ششم", "قوه مقننه", "chapter", [
        ("qa-s3", "باب اول", "مجلس شورای اسلامی", "section", [
            ("qa-t3", "مبحث نخست", "طرح‌ها و صلاحیت‌ها", "topic", ["qa-a71"]),
            ("qa-t4", "مبحث دوم", "هیئت وزیران", "topic", ["qa-a85"]),
        ]),
    ]),
    ("qa-c4", "فصل دوازدهم", "شورای نگهبان", "chapter", [
        ("qa-s4", "باب اول", "ترکیب و صلاحیت", "section", [
            ("qa-t5", "مبحث نخست", "ترکیب و وظایف شورا", "topic", ["qa-a96", "qa-a98"]),
        ]),
    ]),
    ("qa-c5", "فصل سیزدهم", "شورای بازنگری", "chapter", [
        ("qa-s5", "باب اول", "اصلاح قانون اساسی", "section", [
            ("qa-t6", "مبحث نخست", "رویه اصلاح", "topic", ["qa-a177"]),
        ]),
    ]),
]

# --- Qanoon Hemayat Khanevadeh (قانون حمایت خانواده) ---
# Top-level is فصل (no کتاب).
hemayat_toc = [
    ("qhk-c1", "فصل اول", "کلیات", "chapter", [
        ("qhk-s1", "باب اول", "تأسیس و صلاحیت دادگاه‌های خانواده", "section", [
            ("qhk-t1", "مبحث نخست", "تأسیس دادگاه خانواده", "topic", ["qhk-a1"]),
            ("qhk-t2", "مبحث دوم", "صلاحیت رسیدگی", "topic", ["qhk-a2"]),
        ]),
    ]),
    ("qhk-c2", "فصل دوم", "در شروط ضمن عقد", "chapter", [
        ("qhk-s2", "باب اول", "شروط ضمن عقد نکاح", "section", [
            ("qhk-t3", "مبحث نخست", "اقسام شروط", "topic", ["qhk-a22"]),
            ("qhk-t4", "مبحث دوم", "ثبت شروط", "topic", ["qhk-a25"]),
        ]),
    ]),
    ("qhk-c3", "فصل سوم", "در مهریه و نفقه", "chapter", [
        ("qhk-s3", "باب اول", "احکام مهریه", "section", [
            ("qhk-t5", "مبحث نخست", "اجرای مهریه", "topic", ["qhk-a32"]),
        ]),
    ]),
]


# ---- Replacement: regex captures `  toc: [\n...  ],\n` and we substitute
#      `  toc: [\n + BODY + \n  ],\n`. BODY is built above.

text = PATH.read_text(encoding="utf-8")


def replace_toc(text, law_var_marker, body_str):
    """Replace one law's toc body. The regex matches `  toc: [\n` (start)
    up to and including `  ],\n` (end), but leaves `  toc: [\n` and the
    trailing `\n  articles: [` intact. The captured middle is replaced
    with body_str (which contains the array items, one per line, with
    trailing commas)."""
    pattern = re.compile(
        r'(' + re.escape(law_var_marker) + r'.*?  toc: \[\n)'
        r'.*?'
        r'(  \],\n  articles: \[)',
        re.DOTALL,
    )
    new_text, count = pattern.subn(
        lambda m: m.group(1) + body_str + "  " + m.group(2),
        text,
        count=1,
    )
    if count == 0:
        raise RuntimeError(f"No toc match for {law_var_marker}")
    return new_text


edits = [
    ("const qanoonMadani: Law = {", build_toc_body(madani_toc)),
    ("const qanoonMajazat: Law = {", build_toc_body(majazat_toc)),
    ("const qanoonTejarat: Law = {", build_toc_body(tejarat_toc)),
    ("const qanoonKar: Law = {", build_toc_body(kar_toc)),
    ("const qanoonAsasi: Law = {", build_toc_body(asasi_toc)),
    ("const qanoonHemayatKhanevadeh: Law = {", build_toc_body(hemayat_toc)),
]

for marker, body in edits:
    text = replace_toc(text, marker, body)

PATH.write_text(text, encoding="utf-8")
print(f"Done. File now has {len(text.splitlines())} lines.")
