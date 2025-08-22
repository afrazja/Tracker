# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-21
### Added
- Initial stable release of the Tracker App.
- Core trackers: Reading, Expense, Workout, Meditation, plus ability to add custom trackers.
- Dynamic record entry modal with per‑tracker fields and manual date input (YYYY-MM-DD).
- Undo delete snackbar (auto hides after 5 seconds) with record restoration.
- Quick-add preset chips via long-press on tracker cards.
- Derived metric coloring (e.g. pages/hour for reading).
- Empty state guidance components.
- Goals and streak goals management contexts.
- Insights calculation context (initial scaffolding).
- Record retention configuration (limit + prune / archive strategies) with archived counts.
- AsyncStorage persistence with schema versioning & migrations (versions 0→1→2).
- Normalized records index scaffolding (`recordsIndex`) plus selector hooks (`useTrackerRecords`, `useReadingStats`).

### Notes
- Records still duplicated in both `trackers[].records` and `recordsIndex` (transition phase toward full normalization).
- Future releases will remove duplication once all consumers migrate to selector hooks.

[1.0.0]: https://github.com/afrazja/Tracker/releases/tag/v1.0.0
