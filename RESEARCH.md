# Research and license notes · 2026-10-16

- **European Chess Union Education Commission**: Its Chess in Education package includes a 40-lesson school curriculum and 18×6 exercise sequence. Design implication: offer short, progressively scaffolded lessons, separate teacher guidance and practice tasks. Source: https://edu.europechess.org/cie-package/
- **FIDE Chess in Education Commission**: Teacher preparation combines pedagogy, digital tools and educational use of chess. Design implication: support instructors and measurable learning outcomes rather than focusing only on online games. Source (April 2026): https://www.fide.com/fide-chess-in-education-commission-edu-courses-april-2026/
- **chess.js**: BSD-2-Clause licensed, tested open-source move generation/validation and game state. A possible future replacement/reference implementation, but **not copied or bundled** in v0.4. Source: https://github.com/jhlywa/chess.js

**Rights**: This prototype contains original educational questions, original puzzle position selection, custom code and Unicode chess glyphs. No third-party course handouts, proprietary diagrams or protected puzzle databases are redistributed. Research is used to guide structure, not to copy curriculum material. The project is not affiliated with FIDE or the European Chess Union.


## v0.9 verified sources (2026-10-16)
- Supabase Auth official docs: https://supabase.com/docs/guides/auth — JWT + RLS recommended for per-row access; client metadata cannot be used for authorization.
- Supabase JS Auth reference: https://supabase.com/docs/reference/javascript/auth — default session persistence is localStorage; this build opts for memory-only access tokens.
- ECU Chess in Education 40-lesson curriculum: https://edu.europechess.org/cie-package/ — reference for graded curriculum, not copied assets.
- FIDE Chess in Education 2026 course announcement: https://www.fide.com/fide-chess-in-education-commission-edu-courses-april-2026/ — teaching methodology emphasis.
- Lichess database https://database.lichess.org/ — puzzle CSV published CC0, including commercial use. No Lichess data imported into this release.
- Lichess server https://github.com/lichess-org/lila — AGPL-3.0-or-later; do not copy server components into proprietary code without license analysis.
- Turkish Data Protection Authority, 18 February 2026 decision: https://www.kvkk.gov.tr/Icerik/8710/veri-sorumlulari-tarafindan-acik-riza-ve-aydinlatma-metinlerinin-ayri-ayri-duzenlenmesi-gerektigi-hakkinda-kisisel-verileri-koruma-kurulunun-18-02-2026-tarihli-ve-2026-347-sayili-ilke-kararina-iliskin-kamuoyu-duyurusu — separate privacy notice from explicit consent where consent is the lawful basis; obtain legal review before accepting personal data.
