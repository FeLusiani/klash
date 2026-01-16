# Architecture & Tech Stack

## Core Technologies
- **Framework**: React (Vite template)
- **Language**: TypeScript
- **State/Storage**: Dexie.js (IndexDB wrapper) for offline-first data.
- **PWA**: `vite-plugin-pwa` for service worker and manifest generation.

## Directory Structure
- `src/features/`: Contains domain-specific logic (e.g., `todos`, `users`).
    - Each feature folder has: `api`, `components`, `hooks`, `routes`, `types`.
- `src/components/`: Shared UI components (generic buttons, inputs).
- `src/lib/`: Third-party library configurations (e.g., `db.ts` for Dexie).
- `src/styles/`: Global CSS using variables for theming.

## Styling Strategy
- **Vanilla CSS**: No frameworks.
- **Variables**: Defined in `src/styles/variables.css` for easy theming (HSL colors).
- **Reset**: Modern reset in `src/styles/reset.css`.

## Offline Strategy
- Data is persisted in IndexDB via Dexie.
- Service Worker caches assets for offline load.
