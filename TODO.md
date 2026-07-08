# HST ERP - RBAC Implementation

## Completed RBAC Structure

### Role Hierarchy (lower number = higher privilege)
```
1.  Super Administrator     - Full system access, security, backup
2.  System Administrator    - Daily ERP admin (no core security)
3.  IT Support              - Password reset, unlock accounts, view logs
4.  Executive               - High-level approvals, company reports, KPIs
5.  Department Manager      - Department approvals, reports, employee mgmt
6.  Department Supervisor   - First-level approvals, team monitoring
7.  Approver                - Approval-only role
8.  GAD                     - Gate pass final approval, vehicle assignment
9.  HR Officer              - Employee mgmt, leave, attendance, visitors
10. Vehicle Coordinator     - Vehicle assignment, drivers, maintenance
11. Purchasing Officer      - Purchase requests, suppliers, inventory
12. Warehouse Officer       - Assets, borrowing, inventory, receiving
13. Auditor                 - Read-only audit logs, reports, history
14. Security Guard          - Gate pass release, QR verify, visitor check-in/out
15. Employee (ESS)          - Own requests, profile, basic modules
```

### Backend Changes
- **Prisma Schema** - Updated `AppRole` enum with all 15 roles
- **Auth Middleware** - Added role hierarchy levels, `requireRoleLevel()`, `requireDepartmentAccess()`
- **Seed Script** - Comprehensive permission matrix for all roles, departments, control numbers
- **Auth Controller** - Returns `permissions` array in profile response
- **Dashboard Routes** - Role-specific dashboard endpoints (employee, admin, security)
- **Profiles Routes** - Added `include_roles` query param for admin management

### Frontend Changes
- **`src/lib/rbac.ts`** - RBAC utilities: hierarchy, labels, role groups, permission checks
- **`src/hooks/useRBAC.ts`** - React hooks: `useRBAC()`, `usePermission()`, `useHasRole()`
- **`src/components/admin-sidebar.tsx`** - Admin panel sidebar with user/org/system management
- **`src/components/security-sidebar.tsx`** - Security guard portal with gate/visitor/vehicle mgmt
- **`src/routes/_authenticated/admin/route.tsx`** - Admin layout with role guard
- **`src/routes/_authenticated/security/route.tsx`** - Security layout with role guard
- **`src/routes/_authenticated/admin/dashboard.tsx`** - Admin dashboard with stats
- **`src/routes/_authenticated/security/dashboard.tsx`** - Security dashboard with gate stats
- **`src/routes/_authenticated/admin/users.tsx`** - User management with role assignment UI
- **`src/routes/index.tsx`** - Role-based redirect (admin → /admin, security → /security, employee → /employee-portal)

### Key Design Decisions
1. **Departments** define where an employee belongs
2. **Roles** define what they are allowed to do
3. **Approval Workflows** define who approves based on department + request type
4. **Role Hierarchy** allows higher roles to bypass lower-level restrictions
5. **Super/System Administrators** bypass all permission checks
6. **Department Scoping** - Managers can only see their department's data

### Next Steps
- [ ] Create remaining admin pages (roles, permissions, departments, settings)
- [ ] Create security guard pages (gate pass release, QR scanner, visitor check-in/out)
- [ ] Implement approval workflow engine with role-based step routing
- [ ] Add audit logging for all role/permission changes
- [ ] Create role management UI (CRUD for roles and their permissions)