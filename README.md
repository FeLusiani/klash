# Klash

Offline-first character tracker for the Klash tabletop game. The app stores characters locally in IndexedDB, supports YAML import/export, and works as a PWA when built.

Public app: https://felusiani.github.io/klash/

## Commands

```sh
npm ci
npm run dev
npm run lint
npm run build
```

## Run Locally

Start the development server:

```sh
npm ci
npm run dev
```

Open the local URL shown by Vite. With the configured base path, it is usually:

```text
http://localhost:5173/klash/
```

Test the production build locally:

```sh
npm run build
npm run preview
```

## Notes

- Source lives in `src/`; generated output in `dist/` and `dev-dist/` should not be edited by hand.
- Character persistence is in `src/lib/db.ts`; app data is reset when `DATA_VERSION` in `src/config/game.ts` changes.
- GitHub Pages deployment uses the Vite base path `/klash/`.
