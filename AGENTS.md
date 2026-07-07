# Agent Notes

## Commands

- Install: `npm ci`
- Develop: `npm run dev`
- Validate: `npm run lint` and `npm run build`

## Repo Rules

- Do not edit generated `dist/` or `dev-dist/` output.
- Keep changes scoped to `src/`, docs, config, or `public/` assets that are actually used.
- The app stores data in IndexedDB through Dexie. Bump `DATA_VERSION` in `src/config/game.ts` only when existing local data must be wiped.
- Keep documentation short and project-specific.

## Structure

- `src/features/home/`: character list plus YAML import/export.
- `src/features/klash/`: Klash character routes, components, and helper logic.
- `src/lib/`: shared persistence, dice rolling, and versioning code.
- `src/styles/`: reset, CSS variables, and base element styles.
