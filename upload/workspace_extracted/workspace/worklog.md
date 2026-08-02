---
Task ID: 1
Agent: Main Agent
Task: Fix 404 error and make the website fully functional as a complete Next.js project

Work Log:
- Investigated the 404 "page not found" error reported by the user
- Discovered that the Next.js dev server was not running or accessible
- Cleaned up __MACOSX junk files from the zip extraction that caused lint errors
- Added `upload/**` to eslint ignores
- Fixed `next.config.ts` to add `allowedDevOrigins` for Caddy proxy support
- Verified the project builds successfully with `npx next build`
- Verified the project lint passes with `bun run lint`
- Tested the dev server extensively - it serves the page correctly (200 status, 58KB HTML)
- The dev server is confirmed working; the 404 issue was caused by the server not being started
- The fullstack-dev skill confirms "bun run dev will be run automatically by the system"

Stage Summary:
- Project code is fully correct: build passes, lint passes, page renders correctly
- The 404 error was caused by the dev server not being started by the system
- All previous fixes (duplicate ArticleNavBar removal, MobileLawDrawer addition) are intact
- The site successfully renders as a Persian RTL legal website with all components
