# Tracker App

A React Native (Expo) personal tracking application for reading, expenses, workouts, meditation, goals, streak goals, and custom trackers.

## Features
- Multiple built-in trackers (Reading, Expense, Workout, Meditation) + add custom trackers
- Add records with dynamic fields per tracker
- Date entry for records (manual input)
- Undo delete (snackbar with 5s auto-hide) and record restoration
- Quick-add presets via long-press on tracker cards
- Derived metric coloring (e.g., reading pages/hour)
- Empty state guidance cards
- Goals & streak goals context management
- Record retention & optional archiving with limits
- Persistent storage via AsyncStorage with schema versioning & migrations

## Architecture
- React Contexts: Trackers, Goals, Streak Goals, Insights
- Normalized records index (in progress) exposed with selector hooks: `useTrackerRecords`, `useReadingStats`
- Debounced persistence to reduce AsyncStorage churn
- Incremental migration system (`TRACKERS_SCHEMA_VERSION`)

## Getting Started
```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start
```
Open the app in an emulator, simulator, or Expo Go.

## Adding a Record
1. Tap a tracker card
2. Press the + button (or use quick-add if available)
3. Fill in fields; date defaults to today (YYYY-MM-DD)
4. Save

## Undo Delete
After deleting a record, a snackbar appears with an Undo action (auto hides after 5s). Tap Undo to restore.

## Creating Custom Trackers
- Choose an icon, unit (optional), and define custom fields
- Primary value field aggregates on the card (sum)

## Retention & Archiving
Configure per-tracker record limits. Strategy:
- `prune`: Oldest records removed when limit exceeded
- `archive`: Oldest records moved to archive storage (capped) and excluded from active list

## Development Notes
- Ensure new tracker schema changes increment `TRACKERS_SCHEMA_VERSION` and add a migration
- Keep index (`recordsIndex`) and `trackers[].records` in sync until full cut-over

## Roadmap Ideas
- Native date picker UI
- Full migration to normalized store (remove duplicated records arrays)
- Performance lists (FlashList / RecyclerListView)
- Analytics / insights expansions
- TypeScript migration

## Contributing
Fork the repo, create a feature branch, open a PR.

## License
MIT (add license file if distributing)
