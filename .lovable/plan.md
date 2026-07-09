
## Phase 2.5 – Frontend Role-Based Routing

Scope: pure frontend architecture. Auth, JWT, and API endpoints stay untouched.

### 1. Role model (frontend contract)

Canonical role IDs matching backend `ROLE_HIERARCHY` in `src/lib/rbac.ts`:

`super_administrator, system_administrator, executive, department_manager, department_supervisor, gad, hr_officer, security_guard, purchasing_officer, warehouse_officer, vehicle_coordinator, auditor, employee`

Add `src/lib/roles/role-config.ts`:
- `ROLE_TO_PORTAL`: role → portal slug (`super-admin`, `admin`, `executive`, `manager`, `supervisor`, `gad`, `hr`, `security`, `purchasing`, `warehouse`, `vehicle`, `auditor`, `employee`).
- `ROLE_DEFAULT_ROUTE`: role → `/<portal>/dashboard`.
- `ROLE_PRIORITY`: highest privilege wins when a user holds multiple roles.
- `PORTAL_MENU[portal]`: sidebar spec per role (label, icon, `to`, optional children) — matches the menus in the brief.

### 2. Routing layout

Create one pathless per-portal layout under `_authenticated/`, each with its own sidebar + shared `TopBar`:

```text
src/routes/_authenticated/
  super-admin/route.tsx  + dashboard.tsx
  admin/route.tsx        (keep existing pages, add dashboard)
  executive/route.tsx    + dashboard.tsx
  manager/route.tsx      + dashboard.tsx + approvals/reports pages
  supervisor/route.tsx   + dashboard.tsx
  gad/route.tsx          + dashboard.tsx
  hr/route.tsx           + dashboard.tsx
  security/route.tsx     (exists, extend menu)
  purchasing/route.tsx   + dashboard.tsx
  warehouse/route.tsx    + dashboard.tsx
  vehicle/route.tsx      + dashboard.tsx
  auditor/route.tsx      + dashboard.tsx
  employee-portal/route.tsx (exists)
```

Each `route.tsx`:
- `beforeLoad`: role guard via `requirePortal("<portal>")` — reads `/auth/profile`, checks `ROLE_TO_PORTAL[role] === portal` OR admin override; else `throw redirect({ to: "/forbidden" })`.
- Component: `<PortalLayout menu={PORTAL_MENU.xxx} title="..."/>`.

To avoid 12 near-duplicate sidebars, introduce ONE shared `<PortalLayout>` (`src/components/layouts/portal-layout.tsx`) that renders sidebar + topbar + breadcrumb + `<Outlet />` from a menu spec. Each portal route wires its own menu — this satisfies "separate layouts per role" via composition without hundreds of duplicated files.

### 3. Route guards & auth state

`src/lib/auth/require-portal.ts`:
- Reused in every portal `beforeLoad`.
- Not authenticated → redirect `/auth`.
- Wrong portal → redirect `/forbidden`.
- `firstLogin === true` (mock flag) → redirect `/complete-profile`.

Update `src/routes/index.tsx` post-login redirect to use `ROLE_DEFAULT_ROUTE[primaryRole]` (fallback `/employee-portal/dashboard`).

### 4. Error & special pages

New top-level routes:
- `/forbidden` (403 — exists, restyle with illustration + "Return to Dashboard")
- `/unauthorized` (401)
- `/session-expired`
- `/server-error` (500)
- `/complete-profile` — form stub: avatar, phone, emergency contact, password, policies checkbox. On submit, clears mock `firstLogin` flag and routes to dashboard.
- Root `notFoundComponent` already exists — restyle to match.

### 5. Mock role switcher (dev only)

`src/components/dev/role-switcher.tsx`:
- Renders only when `import.meta.env.DEV`.
- Fixed bottom-right FAB, dropdown of 13 roles.
- Writes selected role to `localStorage.mock_role_override`.
- `useUserProfile` and `useRBAC` read the override in DEV and substitute roles, so navigation reflects the chosen role without re-login.
- Never bundled into production paths — guard renders and reads with `import.meta.env.DEV`.

### 6. UX polish

- `LoadingScreen` component with skeleton (branded).
- Route pending indicator via TanStack Router `defaultPendingComponent`.
- Persist sidebar collapsed state in `localStorage` (already partial via shadcn sidebar cookie — verify).
- Theme + last-visited route already persisted; add `last_menu` write in `PortalLayout`.

### 7. Files added/edited

New:
- `src/lib/roles/role-config.ts`
- `src/lib/auth/require-portal.ts`
- `src/components/layouts/portal-layout.tsx`
- `src/components/layouts/portal-sidebar.tsx`
- `src/components/layouts/breadcrumb.tsx`
- `src/components/dev/role-switcher.tsx`
- `src/components/error-pages/{Forbidden,Unauthorized,SessionExpired,ServerError}.tsx`
- 11 new `_authenticated/<portal>/route.tsx` + `dashboard.tsx` stubs
- `src/routes/complete-profile.tsx`
- `src/routes/unauthorized.tsx`, `session-expired.tsx`, `server-error.tsx`

Edited:
- `src/routes/__root.tsx` — mount `<RoleSwitcher />` in dev, register `defaultPendingComponent`.
- `src/routes/index.tsx` — role-based redirect.
- `src/routes/forbidden.tsx` — polish.
- `src/routes/_authenticated/route.tsx` — pass `firstLogin` check.

### 8. Out of scope (explicit)

- No changes to `apiClient`, auth endpoints, JWT, or Supabase clients.
- No new backend logic.
- Existing `admin/`, `security/`, `employee-portal/` route trees stay; only their `route.tsx` migrates to `<PortalLayout>` for consistency (behavior preserved).

Proceed?
