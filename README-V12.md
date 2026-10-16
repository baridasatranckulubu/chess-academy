# Chess Academy v0.12 | Full learning preview

## Open and deploy
Open **academy.html** for the new rich learning environment, or **index.html** for the legacy dashboard, legal chessboard and existing authentication setup. Deploy the entire extracted folder to Netlify, not a single HTML file. The legacy landing page includes a prominent Academy link.

## Included and functional without a backend
- 48 original lesson topics with short Turkish explanations, English lesson titles and English assessment questions, each with three choices, answer feedback, completion progress and next lesson.
- Six-language UI navigation; full pedagogical content translations for de/it/ru/az are **not yet complete**. Those locales show original Turkish explanations and English assessment questions, clearly a limitation.
- 28 existing mate-in-one positions on the chessboard in index.html; chess move legality is handled by the existing engine.
- Local student/parent preview, local teacher preview with create/delete homework tasks, progress statistics and course navigation.
- Progress saved to this browser's localStorage; no personal information, passwords, email, or phone numbers are collected by the demo.
- Existing Supabase integration remains in index.html, **not connected to the preview**. The demo is not real authentication or role-based security.

## Not production ready
A real multi-user platform requires Supabase project credentials, database migrations, row-level policies, verified parental consent, teacher approval workflow, secure server-side assignments and cross-device sync. Premium billing, live email/SMS and course purchases are not enabled. Teacher-created demo homework is shared on this browser only, not with remote students.

## Licensing
All new v0.12 lessons and UI are original text/code written for Chess Academy. No content or code from erdemileogren.com was copied. Lichess puzzle dataset is CC0 (https://database.lichess.org/) and chess.js BSD-2-Clause (https://github.com/jhlywa/chess.js); neither was bundled into v0.12.
