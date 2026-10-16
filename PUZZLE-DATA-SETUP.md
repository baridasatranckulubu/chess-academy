# Lichess 100,000 puzzle import

This build includes **4 actual Lichess sample puzzles**, not 100,000 imported puzzles. The importer and UI are ready to handle 100,000 unique entries in 1000-record JSON shards. The official 300+ MB `.zst` file could not be fetched in the current build environment; the import must be run where the download is available.

1. Download `https://database.lichess.org/lichess_db_puzzle.csv.zst` (Lichess Open Database, CC0).
2. Install `zstd` if not already installed. Python 3 required.
3. From the extracted Chess Academy folder, run:

```bash
python import_lichess.py lichess_db_puzzle.csv.zst --limit 100000 --min-popularity 75 --min-plays 100 --out puzzle-data
```

4. Verify `puzzle-data/manifest.json` shows `count: 100000`. If fewer meet the quality filters, lower the filter values or scan the entire dataset.
5. Upload the **entire** folder including `puzzle-data` to Netlify. Uploading 100 shards as static files may require deploying via Netlify CLI or Git-based deployment rather than drag-and-drop. Test performance and platform limits.

## Format notes

`FEN` is **before** the opponent's first move. The application plays the first UCI move before displaying the position. The solver then follows alternating player/automatic opponent moves. The player move must match the supplied solution line. For mate-in-one, Lichess allows any checkmating move, but this viewer currently accepts only the recorded solution; improve this before full launch.

The importer deduplicates exact FEN + move sequence, validates basic record syntax, filters popularity and play count. It does not engine-validate all imported chess positions. Before public launch, perform a full chess engine validation pass and add malformed record recovery.

Data: https://database.lichess.org/#puzzles , CC0. No Lichess website code copied.
