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

- `src/config/routes.ts` — single source of truth for the public sitemap
  (route ids, paths, Arabic labels, nav order, footer groups).
- `src/config/router.tsx` — the router. Public routes are code-split and
  rendered inside `PublicLayout`.
- `src/pages/*` — public page components (Arabic). `src/pages/NotFoundPage.tsx`
  is the catch-all 404 page.
- `src/components/layout/*` — `PublicLayout` (active), `MemberLayout` and
  `AdminLayout` (skeletons, not mounted until auth is implemented).
- `src/components/routing/*` — `PagePlaceholder`, `RouteErrorPage`,
  `RouteFallback`, `ScrollToTop`.
- `src/styles/index.css` + `layout.module.css` — RTL/Arabic foundation using
  CSS logical properties.
- `src/types/index.ts` — shared types (`Role`, `SessionUser`, `BaseEntity`,
  `PaginatedResult`).
- `src/features/<domain>/types.ts` — per-domain entity types (future
  Supabase mapping).

## Authentication (deferred)

Not implemented yet. The member (`/account`) and admin (`/admin`) areas are
reserved in `routes.ts` via `FUTURE_AREAS` and are intentionally NOT mounted in
the router until authentication and authorization exist.

## Environment

See `.env.example`. `VITE_*` variables are client-safe; server variables
(`RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_FROM_EMAIL`) live only
in Vercel serverless functions and must never be imported client-side.
