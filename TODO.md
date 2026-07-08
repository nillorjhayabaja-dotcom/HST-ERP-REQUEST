# TODO - Portal RBAC Routing Refactor

- [ ] Centralize role->portal mapping (done: src/lib/portal-rbac.ts)
- [ ] Centralize dashboard + layout resolvers (done: src/lib/route-resolvers.ts)
- [ ] Add redirect helper that preserves intended destination (partially done)
- [ ] Remove hardcoded redirect logic from `src/routes/index.tsx`
- [ ] Remove hardcoded redirect logic from `src/routes/auth.tsx`
- [ ] Convert layout `beforeLoad` guards to access enforcement only (no redirects duplication)
- [ ] Add/route `Forbidden 403` page and wire it into guards
- [ ] Add portal access guard for refresh-safe behavior
- [ ] Ensure case-insensitive role comparisons everywhere
- [ ] Update sidebars to auto-switch based on resolved portal (if needed)
- [ ] Typecheck + run build/tests

