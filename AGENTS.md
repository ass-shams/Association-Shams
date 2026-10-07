# Association Shams — dev guide

Setup: install dependencies, then run the dev server.

```bash
npm install
npm run dev        # Vite dev server  http://localhost:5173
```

## Commands

| Command        | What it does                              |
| -------------- | ----------------------------------------- |
| `npm run dev`  | Start the Vite dev server                 |
| `npm run build`| Type-check + production build to `dist/`  |
| `npm run lint` | Lint all files with oxlint                |
| `tsc -b`       | Type-check without emitting               |

## Architecture

- `src/App.tsx` — application root: public shell (navbar + main + footer),
  the route table, and the single stylesheet import.
- `src/styles.css` — the ONLY stylesheet. Design tokens, base/RTL styles,
  layout, UI kit and page styles all live here. Use CSS logical properties
  only (never `left`/`right`).
- `src/pages/public/*` — public page components (Arabic). Each page has no
  CSS file of its own. `src/pages/NotFoundPage.tsx` is the catch-all 404 page.
- `src/components/*` — the elements repeated across the site: `navbar.tsx`,
  `footer.tsx`, `finalCTA.tsx`, `mobilemenu.tsx`. Navigation links are
  hardcoded in `navbar.tsx` (exported as `NAV_LINKS`).
- `src/types/index.ts` — shared types (`Role`, `SessionUser`, `BaseEntity`,
  `PaginatedResult`).

Every element writes its own inline markup (plain HTML + inline SVG icons).
There is no shared UI kit; page classes are global (not CSS modules) and are
grouped in `styles.css` by page under clear section comments.

## Authentication (deferred)

Not implemented yet. The member (`/account`) and admin (`/admin`) areas are
reserved in `routes.ts` via `FUTURE_AREAS` and are intentionally NOT mounted in
the router until authentication and authorization exist.

## Environment

See `.env.example`. `VITE_*` variables are client-safe; server variables
(`RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_FROM_EMAIL`) live only
in Vercel serverless functions and must never be imported client-side.
