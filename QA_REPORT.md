# Chess Academy v0.9 · QA · 2026-10-16

## Baseline v0.8
- Node.js chess rules regression: 10/10 test groups passed.
- Headless Chromium existing desktop/mobile regression passed; 390px mobile viewport had no horizontal overflow.

## Bugs and corrections
1. v0.8 loaded stored mate-solved IDs before `const puzzles` was initialized. The resulting ReferenceError was swallowed by `catch`, resetting visible puzzle progress on every page reload. Moved restore logic after puzzle catalogue definition; seeded-browser test now proves 2/28 persists.
2. The HTML title was still v0.6. Updated to v0.9.
3. v0.8 displayed the role-related message using untrusted user metadata. v0.9 fetches the signed-in user's profile using their JWT and Supabase RLS; the verified role alone drives the dashboard shortcut. Profile fetch errors fail closed.
4. v0.8 account UI was Turkish-only. Core login/signup/role/age/account text now uses a separate 6-language dictionary (tr/en/de/it/ru/az).

## Features added
- Profile lookup and role-specific dashboard shortcut after successful login. Dashboards themselves remain demo content and are not protected routes.
- User-initiated email password-recovery request (no email sent during testing). The password-update callback UI is not implemented.
- Student age selection. Under-18 self-registration is blocked by client checks and server-trigger adult declaration. Self-declared age is not identity/age verification.
- Additional server-side constraints on profile lengths; no direct client update/insert policy.

## Executed tests
- `node tests/engine.test.js`: PASS 10 groups; standard initial-position perft 20/400/8,902/197,281.
- `node tests/puzzles.test.js`: PASS all 28 FENs, legal solutions, checkmate result, undo; each position was additionally checked to have a unique mate-in-one move.
- `python tests/browser_qa.py`: PASS desktop/mobil, move, undo, quiz, six locales, parent demo, XSS text escaping; no runtime errors; mobile width 390/390.
- `python tests/browser_auth_qa.py`: PASS mock sign-in, RLS-profile role handling, forged metadata ignored, profile failure denied, six-language auth, password-recovery button, under-18 block, adult signup with no student phone/address, local puzzle progress, 1.7s next-puzzle advance, 390px mobile signup layout; no runtime errors.
- `node --check auth.js` and `node --check board-game.js`: PASS.
- ZIP integrity verified using `unzip -t`.

## Not tested / not deployed
- No live Supabase project/credentials, SQL execution, SMTP or production network test.
- No real user accounts, password-reset emails, notifications or payments created/sent.
- No real device matrix, penetration test or accessibility audit; automated Chromium is not a substitute.
- Public Netlify URL was NOT updated automatically. The ZIP must be deployed manually to the existing site.
- Parent-child linkage, guardian consent verification, username/password login, persistent sessions, cross-device progress and genuine role-protected dashboards remain unimplemented.
