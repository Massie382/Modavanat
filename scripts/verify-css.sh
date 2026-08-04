#!/bin/bash
# Start dev server, wait, fetch admin page, fetch CSS, verify switch rules
cd /home/z/my-project

# Kill any existing
pkill -9 -f "next" 2>/dev/null
pkill -9 -f "postcss" 2>/dev/null
sleep 2

# Clear cache
rm -rf .next 2>/dev/null

# Start dev server in background
npx next dev -p 3000 > dev.log 2>&1 &
DVPID=$!

# Wait for server to be ready (max 20 seconds)
echo "Waiting for dev server (PID $DVPID)..."
for i in $(seq 1 20); do
  if curl -s -o /dev/null http://localhost:3000/admin 2>/dev/null; then
    echo "Server ready after ${i}s"
    break
  fi
  sleep 1
done

# Give it a moment more
sleep 3

# Fetch admin page
echo "---FETCHING ADMIN PAGE---"
curl -sL -o /tmp/admin.html http://localhost:3000/admin 2>&1
echo "Admin page size: $(wc -c < /tmp/admin.html) bytes"

# Extract CSS URL
CSS_URL=$(grep -oP '/_next/static/chunks/[^"]*globals[^"]*\.css' /tmp/admin.html | head -1)
echo "CSS URL: $CSS_URL"

# Fetch CSS
curl -sL "http://localhost:3000${CSS_URL}" -o /tmp/compiled.css 2>&1
echo "Compiled CSS size: $(wc -c < /tmp/compiled.css 2>/dev/null || echo 0) bytes"

# Show switch rules
echo ""
echo "===== ADMIN-SWITCH RULES IN COMPILED CSS ====="
if [ -f /tmp/compiled.css ]; then
  grep -oE '[^{}]*admin-switch[^{}]*\{[^{}]*\}' /tmp/compiled.css || echo "(no matches found with that pattern)"
  echo ""
  echo "===== GREP FOR translateX OR inset-inline ====="
  grep -oE '(translateX\(-?16px\)|inset-inline-start:[^;}]+|overflow:hidden)' /tmp/compiled.css | head -20
fi

echo ""
echo "===== DEV LOG TAIL ====="
tail -10 /home/z/my-project/dev.log

# Kill dev server
kill $DVPID 2>/dev/null
pkill -9 -f "next" 2>/dev/null
echo "Done."
