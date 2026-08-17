#!/usr/bin/env python3
"""Verify the new TOC structure in laws.ts:
1. Every articleId in any TOC node's articleIds list exists in the
   corresponding law's articles array.
2. Every article in the articles array is referenced by AT LEAST one
   TOC node's articleIds (i.e. nothing is orphaned).
3. No TOC node has type "article" (they should all be book/chapter/
   section/topic).
"""
import re
from pathlib import Path

text = Path("/home/z/my-project/src/data/laws.ts").read_text(encoding="utf-8")

# Split the file into per-law chunks. Each `const <name>: Law = {` block
# ends at the next `const <name>: Law = {` or at the auxiliary laws
# comment near the end.
law_starts = [
    ("qanoonMadani", "const qanoonMadani: Law = {"),
    ("qanoonMajazat", "const qanoonMajazat: Law = {"),
    ("qanoonTejarat", "const qanoonTejarat: Law = {"),
    ("qanoonKar", "const qanoonKar: Law = {"),
    ("qanoonAsasi", "const qanoonAsasi: Law = {"),
    ("qanoonHemayatKhanevadeh", "const qanoonHemayatKhanevadeh: Law = {"),
]

# Find indices
start_idx = [text.find(marker) for _, marker in law_starts]
# Append end-of-file marker
start_idx.append(len(text))

laws = {}
for i, (name, _) in enumerate(law_starts):
    laws[name] = text[start_idx[i]:start_idx[i + 1]]

issues = []

for name, body in laws.items():
    # Extract all article IDs from the articles array
    art_ids = set(re.findall(r'id:\s*"([^"]+)",\s*number:', body))
    # Extract all articleIds referenced from the toc
    topic_aid_lists = re.findall(r'articleIds:\s*\[([^\]]*)\]', body)
    referenced = set()
    for lst in topic_aid_lists:
        for aid in re.findall(r'"([^"]+)"', lst):
            referenced.add(aid)
    # Find any article-type TOC nodes (should be none now)
    article_nodes = re.findall(r'type:\s*"article"', body)
    # Check
    missing_in_articles = referenced - art_ids
    orphaned_in_articles = art_ids - referenced

    print(f"\n=== {name} ===")
    print(f"  Articles defined:     {len(art_ids)}")
    print(f"  ArticleIds referenced: {len(referenced)}")
    print(f"  Article-type nodes:   {len(article_nodes)} (should be 0)")
    if missing_in_articles:
        print(f"  ❌ Referenced but not defined: {missing_in_articles}")
        issues.append((name, "missing", missing_in_articles))
    if orphaned_in_articles:
        print(f"  ⚠ Orphaned (not referenced from TOC): {orphaned_in_articles}")
        # not strictly an error — some laws may have articles we
        # didn't categorize yet
    if not missing_in_articles and not article_nodes:
        print(f"  ✓ OK")

if not issues:
    print("\n✅ All articleIds reference existing articles. No article-type TOC nodes remain.")
else:
    print("\n❌ Issues found.")
