# Chess Academy v0.18: Classroom analysis

New `classroom.html` is embedded into the academy sidebar as **Sınıf Analizi**. The teacher can play legal moves, navigate history, import UCI moves (not full SAN PGN), save the move list and notes locally, export text, and open the current FEN in Lichess analysis for Stockfish. The embedded Lichess board requires internet. This is not a live multi-user collaboration tool; other devices cannot see the data. Do not use computer assistance in live competitive games.

Licenses: The application does not bundle Lichess or Stockfish code. It links to Lichess' hosted analysis board. The existing local chess engine checks legal moves. Respect Lichess usage limits. Full SAN/PGN parser, authenticated teacher/student shared persistence and real-time broadcasts remain future tasks.
