#!/bin/bash
# Brand rename: قانون‌یاب → مدونات, ghanunyab.ir → modavanat.ir
# Uses sed with literal Persian strings (UTF-8 aware).

set -e
cd /home/z/my-project

FILES=(
  src/app/layout.tsx
  src/components/site/AboutView.tsx
  src/components/site/Header.tsx
  src/components/site/Footer.tsx
  src/components/law/tabs/ContentTab.tsx
  src/components/law/tabs/ResourcesTab.tsx
  src/components/home/HomeView.tsx
  src/data/laws.ts
)

echo "=== Brand rename: قانون‌یاب → مدونات, ghanunyab.ir → modavanat.ir ==="

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    # Replace قانون‌یاب with مدونات (literal UTF-8 strings)
    sed -i 's/قانون‌یاب/مدونات/g' "$f"
    # Replace ghanunyab.ir with modavanat.ir
    sed -i 's/ghanunyab\.ir/modavanat.ir/g' "$f"
    echo "  updated: $f"
  else
    echo "  MISSING: $f"
  fi
done

echo ""
echo "=== Remaining occurrences (should be 0) ==="
grep -rn "قانون‌یاب\|ghanunyab" src/ 2>&1 || echo "  (none found — clean)"
