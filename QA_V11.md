# QA v0.11
- PASS: Node syntax for learning.js and auth.js.
- PASS: engine.test.js (10 suites), puzzles.test.js (28 positions).
- PASS: Chromium 390px unauthenticated content gate, six-language navigation, disabled unconfigured login, no JS errors.
- INCOMPLETE: Browser-based authenticated progress test blocked by browser network/file origin restrictions; requires deployed environment.
- SECURITY: Client-side gating is not authorization for server data; Supabase RLS and authenticated server API remain essential.
- LIMITATION: Login needs Supabase project configuration, otherwise users cannot actually register or sign in.
