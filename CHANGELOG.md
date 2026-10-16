# v0.20
- 48 ders tek kaynaktan, 6 dilde (TR ana dil; diğerleri AI taslağı): `data/` + `i18n/lessons/` -> `lessons-data.js`
- Ders ekranı seçilen dilde; eksik çeviri TR'ye düşer ve uyarı gösterir
- Hata: doğru şık hep ilk sıradaydı, artık karıştırılıyor
- 16 sabit TR/EN arayüz metni 6 dilde
- Yeni: tools/check-i18n.js, tools/build-lessons.js, tests/browser_lessons_qa.py

# v0.17
- Teacher feedback notes per student
- Weekly lesson goals per student
- Weekly study planning dashboard
- Seven-day quiz activity snapshot

## v0.14
- Ana URL doğrudan birleşik akademi panelini açıyor.
- Öğrenci/Veli ve Öğretmen demo girişleri korunuyor.
- Sol menüye panel içi Taktik Merkezi ve Satranç Tahtası eklendi.
- Tahta için ayrı board.html üretildi.
- Taktik ve tahta içerikleri iframe ile tek çalışma alanında açılıyor.
- Gerçek üyelik ve 100K veri henüz etkin değil.

# Change log

## v0.4 · 2026-10-16
### Fixed from v0.3
- v0.3's actual code supported only basic movement despite an earlier status report claiming castling, en passant, mate detection and undo. These features are **now implemented and tested** in v0.4.
- Reset quiz progress now resets the attempted-question ledger, allowing legitimate replay and XP earning after a reset.
- Re-answering a previously completed quiz question no longer falsely displays the '+20 XP' reward message.
- Replaced outdated board notice claiming moves are not validated.
- Removed English fallback from the four partially translated dashboard languages (German, Italian, Russian, Azerbaijani).
- Added a storage fallback to prevent a crash when localStorage is blocked; fallback is ephemeral.
### New
- Standalone testable `ChessEngine` with castling, en passant, all promotion choices, checkmate/stalemate, undo, draw detection and perft.
- Board orientation toggle, legal-target indicators, promotion selector, move list and accessible buttons.
- Four interactive mate-in-one puzzles with first-solve tracking.
- Six modules with local completion state and a sample parent progress view.
- Node engine regression tests and automated desktop/mobile browser interaction tests.
### Known limitations
- No accounts, real messaging, payments, real institution dashboards or server storage.
- Chess engine does not cover all official tournament adjudication details.
- Full browser QA on actual consumer browsers/devices remains necessary before launch.

## v0.3
- Basic move geometry and check safety, local quiz attempt tracking. Castling, en passant and mate detection were **not** in the original v0.3 source.

## v0.2
- Tactics quiz, six learning pathway previews, demo notification feed.
\n## v0.5 | Premium board and pieces\n- Replaced flat Unicode board pieces with locally rendered gradient-shaded SVG vector pieces.\n- Added walnut-and-ivory board squares, warm timber border, brass trim, realistic piece shadows, and coordinate markers.\n- Preserved the existing chess engine, interactions, keyboard button controls, move history, and translations.\n- No external image or font downloads required.\n
## v0.6 | Accessible touch interactions
- Whole-square hit areas, including transparent regions around pieces.
- Tap-to-select + tap-to-move retained; added press-and-drag pointer support for touch, pen and mouse.
- Reduced accidental browser scrolling/selection during board interaction.
- Piece SVG and coordinate labels no longer intercept touches.
- Stronger keyboard focus, selection and legal-target indicators.

## v0.7 | Puzzle flow and 3D interactions
- Added 24 automatically generated and engine-verified queen mate-in-one exercises, bringing total to 28 positions.
- Added 1.7-second automatic next-puzzle transition after correct mate, with manual Next button retained.
- Board flip uses perspective Y rotation with mid-animation board swap; reduced-motion users get immediate flip.
- Selected pieces enlarge and rise with deeper shadows; square-size touch targets retained.
- Existing mate progress storage remains compatible with earlier versions.

## v0.8 | Authentication integration scaffold
- Added responsive student/parent/teacher signup and login UI.
- Added email/password authentication integration using Supabase Auth REST API (requires owner configuration).
- Username, name, optional parent phone/address; student phone/address not collected.
- Added RLS-protected profiles schema and server-side teacher approval rule.
- No tokens/passwords stored in localStorage; teacher role cannot be granted by signup metadata.
- Real login remains disabled until Supabase credentials, database schema and child-safety procedures are configured.

## v0.9 | Authentication reliability, age safety, multilingual access
- Fixed mate-puzzle progress silently resetting on reload: restored saved IDs only after puzzle catalogue initialization.
- Added server-verified profile read using Supabase RLS; account role and dashboard shortcut never trust user-supplied metadata.
- Added user-initiated email password-recovery request; no email sent by build/tests.
- Added student age gate: under-18 self-registration blocked pending verifiable guardian consent.
- Added auth navigation/role/status labels in six languages; parent/teacher/student role display.
- Retained email/password login; username login requires a separately secured backend.
- Expanded regression tests to all 28 mate puzzles, progress persistence, age gate, and mocked authentication.

## v0.10 | Private progress backup
- Added explicit Cloud Save / Cloud Restore controls for verified signed-in users.
- Added Supabase RLS-protected learning_progress table and user-scoped GET/upsert.
- Added validated local progress import with UI refresh; restore requires confirmation.
- Added six-language cloud control labels and feedback.
- No automatic upload of anonymous demo progress; no external account created.

## v0.11 · Auth-gated learning area
- Combined Student/Parent navigation into one learner entry point.
- Added 12 original chess lessons, each with explanations and interactive multiple-choice checks.
- Added per-account, per-device lesson completion progress; this is NOT cloud synchronization.
- Locked lesson workspace behind verified Supabase profile with student/parent role; teacher cannot access learner workspace.
- Added responsive lesson list, lesson detail, quiz feedback and next lesson controls.
- Added 6-language learning navigation labels; full lesson/quiz localization remains incomplete.
- No third-party website source code copied because no verifiable open-source license was found.

## v0.12 — Course platform demo
- New `academy.html` and `academy.css` premium learning app with student/parent and teacher demo views.
- 48 original learning topics, each with a graded three-choice exercise and saved local completion.
- Teacher preview creates and deletes local assignments; student preview can navigate assignments to lessons.
- Progress dashboard, lesson list, responsive sidebar, and six-language navigation.
- Legacy board, account pages and 28 chess puzzles preserved in `index.html`.
- Demo is deliberately not password authentication; never treats local demo roles as verified user roles.

## v0.13 — Lichess tactics pipeline
- Added `puzzles.html` tactical training UI with actual chess move validation and automatic opponent replies.
- Added difficulty and theme filtering, hint, retry, next, automatic advancement.
- Added streaming CSV/Zstandard importer, exact deduplication, basic validation, popularity and play count filters, 1000-puzzle shards, manifest and 100k limit.
- Bundled **4 official Lichess sample puzzles** for immediate testing. **100,000 puzzles have not yet been downloaded or imported.**
- Added link to tactics center from academy sidebar.

## v0.15
- Örnek öğrenci seçimi, üstte öğrenci adı, öğretmen öğrenci listesi ve öğrenci ayrıntı paneli.
- Öğrenciye özel ödevler, tamamlanan dersler, test soru/doğru sayıları, oturum süresi.
- Video istatistiği yalnızca doğrulanmış kayıtlar için (şimdilik 0).

## v0.19
- Lichess Cloud Eval best-move translucent arrow in class analysis board.
- 800ms debounce, response race protection, move legality validation, cache, HTTP 404/429 handling.
- Automatic hints toggle and manual refresh; no false 100% accuracy claim.
