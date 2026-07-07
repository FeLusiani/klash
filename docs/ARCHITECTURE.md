# Architecture

Klash is a Vite, React, and TypeScript PWA.

- `src/routes/` defines app routes.
- `src/features/home/` lists, imports, and exports characters.
- `src/features/klash/` contains character creation, editing, sheet UI, dice selectors, and game helpers.
- `src/lib/db.ts` owns the Dexie IndexedDB schema.
- `src/config/game.ts` defines abilities, dice progression, and data-version resets.

Styling is plain global CSS. Shared theme values live in `src/styles/variables.css`; route-specific styles sit next to the route that imports them.
