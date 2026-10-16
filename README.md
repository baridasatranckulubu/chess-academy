# Chess Academy v0.5 | Interactive prototype

**Open `index.html` in Chrome, Edge or Firefox** (or upload the entire extracted folder to a static host). The page requires `engine.js`, `translations.js` and `board-game.js` alongside `index.html`. No npm install, server or external API is required for normal use.

## Features
- Responsive dark/gold academic UI and six languages: Turkish, English, German, Italian, Russian and Azerbaijani. Dashboard copy has been translated across all six locales.
- Playable chessboard with turn enforcement, check/checkmate/stalemate, castling, en passant, pawn promotion (queen/rook/bishop/knight), move history, undo, board rotation and legal-move highlighting.
- Four original mate-in-one board exercises (including a black-to-move puzzle). First-time solutions are tracked locally.
- Six learning modules with manually marked completion, reflected in a sample parent overview.
- Previous multiple-choice tactical quiz, XP progress and demo notification feed preserved. Resetting quiz progress now also clears the attempted-question list.
- Basic accessibility: focus styles, button-based keyboard-operable squares, screen-reader square names and status announcements.

## Privacy and limitations
**Prototype, not production:** There is no login, database, payments, real parent-to-child association, SMS, email, live chess opponent or AI analysis. All practice and lesson state is kept on this device using localStorage when allowed. If browser storage is blocked, data is temporary and may disappear on reload. Demo notifications never leave the browser. The parent panel mixes clearly labelled sample data with real on-device practice progress.

The rules engine is a new, dependency-free implementation for this prototype. It supports 50-move and threefold draw detection, but does **not** implement every FIDE adjudication detail (e.g. 75-move/fivefold automatic draws, clock handling, draw offers, PGN/SAN notation, comprehensive FEN validity checks). Do not use it to adjudicate official tournaments without an independently certified rules implementation.

## QA
Run `node tests/engine.test.js` for automated chess rule tests (including standard starting-position perft 20 / 400 / 8,902 / 197,281). `python tests/browser_qa.py` uses Playwright + Chromium if installed. Browser QA uses an in-memory storage shim due to sandbox browser restrictions. Tests cover board interactions, quiz XP/reset, notifications escaping, language switching and desktop/mobile overflow.

## Deployment
For Netlify Drop, drag the **extracted folder**, not just `index.html`. All four runtime files must be uploaded. There is no live URL until the folder is published.

## Versioning
See `CHANGELOG.md`, `QA_REPORT.md` and `RESEARCH.md` for verified changes, test evidence and research. Screenshots `mobile.png` and `desktop.png` are test previews.
\n### v0.5 design update\nOpen index.html in Chrome. Chess pieces are vector-rendered using system chess glyphs with layered metallic/ivory SVG shading. Exact glyph shape may vary by operating system.\n
### v0.6 touch controls
Tap any part of a piece's square, then tap a highlighted destination. You can also drag from one square to another. The whole square is interactive; the visual piece is not a tiny separate hit target.

## v0.9 release
- Profile roles are fetched from the RLS-protected database after sign-in. Teacher applications remain pending until trusted approval.
- Students younger than 18 cannot self-register yet. This is an interim safety restriction, not a complete legal solution.
- User progress remains local demo state, not tied to signed-in accounts. Dashboard pages are still demo views, not authorization boundaries.
- `tests/browser_auth_qa.py` mocks network responses; it does not validate a real Supabase deployment.

## v0.10 cloud progress
For authenticated adult test accounts only, follow `SETUP-AUTH.md` and run `supabase-progress-v10.sql`. Account page provides manual backup and restore. Existing lessons and mate challenges still work offline.

### v0.13 tactics center
Open `puzzles.html` through a local HTTP server (or Netlify), not `file://`, because puzzle data is loaded via `fetch`. Four official Lichess sample records are bundled for smoke testing. To import up to 100,000 records, follow `PUZZLE-DATA-SETUP.md`. The 100k dataset is **not bundled**.
