# lastsaas frontend — Tailux rebuild

The lastsaas frontend rebuilt from scratch using the Tailux design system.
Replaces the original CRA-based frontend with Vite + React 19 + Tailwind v4.

## Quick start

```bash
git clone https://github.com/mego1123/lastsaas-frontend.git
cd lastsaas-frontend
npm install
npm run dev
```

The app starts on **http://localhost:5174**.

The Vite dev server proxies `/api` to `http://localhost:8080` (the lastsaas Go backend).
Make sure the Go backend is running on port 8080.

## What's included

### Auth system
- `src/app/contexts/auth/` — AuthContext with JWT + silent token refresh + MFA
- `src/app/contexts/tenant/` — TenantContext (tenant switching)
- `src/utils/axios.ts` — axios with auth + tenant header interceptors
- `src/utils/api.ts` — typed API client (all lastsaas endpoints)
- `src/utils/jwt.ts` — token validation + session management
- `src/configs/auth.ts` — token storage keys

### Routes (40 total, all lazy-loaded)
- **10 public**: /, /login, /signup, /verify-email, /forgot-password, /reset-password, /auth/callback, /auth/mfa, /auth/magic-link, /setup
- **12 app**: /dashboard, /team, /settings, /plan, /buy-credits, /billing/success, /billing/cancel, /activity, /onboarding, /messages
- **18 admin** (under /last): dashboard, users, tenants, members, plans, financial, pm, promotions, announcements, health, logs, config, api, branding, about

### Pages
- **6 app pages** with real API integration (TanStack Query)
- **14 admin pages** with TanStack Table, modals, forms
- All pages follow Tailux design system: `<Page>` wrapper, 12-col grid, Card/Button/Badge/Table components

### Navigation
- Unified sidebar (app + admin + account in ONE sidebar — fixes the original's broken nav)
- 3 segments: App, Admin, Account
- Icons from @heroicons/react/24/outline

### Stack
- Vite 6 + React 19 + TypeScript 5
- Tailwind CSS v4 (no config file — @theme in CSS)
- react-router v7 (createBrowserRouter, lazy routes)
- @tanstack/react-query (data fetching)
- @tanstack/react-table (tables)
- react-hook-form + zod (forms)
- @headlessui/react (modals, dialogs)
- sonner (toasts)
- @heroicons/react (icons)

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

## Connecting to the lastsaas backend

The frontend expects the Go backend at `http://localhost:8080` with these API patterns:
- `POST /api/auth/login` — returns `{ accessToken, refreshToken, user, memberships }`
- `GET /api/auth/me` — returns `{ user, memberships }`
- `POST /api/auth/refresh` — returns new tokens
- `GET /api/admin/tenants` — tenant list
- `GET /api/admin/users` — user list
- etc. (see `src/utils/api.ts` for all endpoints)

Token storage keys (must match backend):
- `lastsaas_access_token`
- `lastsaas_refresh_token`
- `lastsaas_tenant_id`
