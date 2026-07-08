# HST ERP - RBAC Implementation Guide

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented for the HST Enterprise Portal.

## Role Hierarchy

The system implements a 15-level role hierarchy where **lower numbers indicate higher privilege**:

```
Level 1:  Super Administrator     - Full system access, security, backup
Level 2:  System Administrator    - Daily ERP admin (no core security)
Level 3:  IT Support              - Password reset, unlock accounts, view logs
Level 4:  Executive               - High-level approvals, company reports, KPIs
Level 5:  Department Manager      - Department approvals, reports, employee mgmt
Level 6:  Department Supervisor   - First-level approvals, team monitoring
Level 7:  Approver                - Approval-only role
Level 8:  GAD                     - Gate pass final approval, vehicle assignment
Level 9:  HR Officer              - Employee mgmt, leave, attendance, visitors
Level 10: Vehicle Coordinator     - Vehicle assignment, drivers, maintenance
Level 11: Purchasing Officer      - Purchase requests, suppliers, inventory
Level 12: Warehouse Officer       - Assets, borrowing, inventory, receiving
Level 13: Auditor                 - Read-only audit logs, reports, history
Level 14: Security Guard          - Gate pass release, QR verify, visitor check-in/out
Level 15: Employee (ESS)          - Own requests, profile, basic modules
```

## Key Features

### 1. Hierarchical Access Control
- Higher-level roles automatically inherit permissions from lower levels
- Super Administrator (level 1) bypasses all permission checks
- System Administrator (level 2) bypasses most checks except core security
- Department scoping: Managers can only see their department's data

### 2. Three Portal Types

#### Admin Portal (`/admin/*`)
**Access:** Super Administrator, System Administrator, IT Support

**Sidebar Sections:**
- Workspace: Dashboard, Notifications, Profile
- User Management: Users, Roles, Permissions
- Organization: Departments, Positions, Workflows, Control Numbers
- System: Settings, Audit Logs, Backup, Health, Server Config
- Oversight: Reports, Gate Pass Settings

**Pages:**
- `/admin/dashboard` - System stats (users, departments, roles, approvals)
- `/admin/users` - User management with role assignment
- `/admin/roles` - Role-permission matrix management
- `/admin/workflows` - Approval workflow configuration
- `/admin/departments` - Department management
- `/admin/settings` - System settings

#### Security Portal (`/security/*`)
**Access:** Security Guard role (and above)

**Sidebar Sections:**
- Workspace: Dashboard, Notifications
- Gate Access: Today's Gate Passes, QR Scanner, Verify Pass, Release Gate Pass
- Visitors: Check-in, Check-out, Logs
- Vehicles: Logs, Check
- Time Logs: Record Time Out, Record Time In

**Pages:**
- `/security/dashboard` - Gate monitoring stats
- `/security/gate-passes/today` - Today's gate passes with release actions
- `/security/gate-passes/scanner` - QR code scanner/verification
- `/security/visitors/check-in` - Visitor registration form
- `/security/visitors/check-out` - Active visitor check-out

#### Employee Portal (`/employee-portal/*`)
**Access:** All authenticated users (default)

**Features:**
- Personal dashboard with request stats
- My Requests (unified view of all requests)
- Profile management
- Module-specific pages: Gate Pass, Leave, MRF, Visitors, Vehicles, Assets, Purchase Requests

### 3. Smart Root Redirect

The root path `/` automatically redirects based on user role:
- Super/System Administrator → `/admin/dashboard`
- Security Guard (without higher roles) → `/security/gate-passes/today`
- All others → `/employee-portal/dashboard`

## File Structure

### Backend

```
backend/
├── prisma/
│   ├── schema.prisma          # Updated AppRole enum with 15 roles
│   └── seed.ts                # Comprehensive permissions + roles seed
├── src/
│   ├── middleware/
│   │   └── auth.ts            # Role hierarchy, requireRoleLevel(), requireDepartmentAccess()
│   ├── controllers/
│   │   └── auth.controller.ts # Profile returns permissions array
│   ├── routes/
│   │   ├── dashboard.routes.ts # Role-specific dashboard endpoints
│   │   ├── profiles.routes.ts  # include_roles query param
│   │   └── ... (existing routes)
```

### Frontend

```
src/
├── lib/
│   └── rbac.ts                # RBAC utilities, constants, helper functions
├── hooks/
│   └── useRBAC.ts             # React hooks for permission/role checks
├── components/
│   ├── admin-sidebar.tsx      # Admin panel sidebar (red theme)
│   ├── security-sidebar.tsx   # Security portal sidebar (amber theme)
│   └── app-sidebar.tsx        # Employee sidebar (existing)
├── routes/
│   ├── index.tsx              # Role-based root redirect
│   └── _authenticated/
│       ├── route.tsx          # Main authenticated layout
│       ├── admin/
│       │   ├── route.tsx      # Admin layout with role guard
│       │   ├── dashboard.tsx  # Admin dashboard
│       │   ├── users.tsx      # User management
│       │   ├── roles.tsx      # Role-permission management
│       │   ├── workflows.tsx  # Workflow configuration
│       │   ├── departments.tsx
│       │   └── settings.tsx
│       ├── security/
│       │   ├── route.tsx      # Security layout with role guard
│       │   ├── dashboard.tsx  # Security dashboard
│       │   └── gate-passes/
│       │       ├── today.tsx  # Today's gate passes
│       │       └── scanner.tsx # QR scanner
│       │   └── visitors/
│       │       ├── check-in.tsx
│       │       └── check-out.tsx
│       └── employee-portal/   # Existing employee pages
```

## Usage Examples

### Backend: Protecting Routes

```typescript
import { authenticate, requireRoleLevel, requirePermission } from '@/middleware/auth';

// Only allow level 3 and above (IT Support, Admins)
router.get('/admin-stats', authenticate, requireRoleLevel(3), async (req, res) => {
  // ...
});

// Check specific permission
router.post('/users', authenticate, requirePermission('users', 'create'), async (req, res) => {
  // ...
});

// Department-scoped access
router.get('/department-data', authenticate, requireDepartmentAccess, async (req, res) => {
  const userDeptId = (req as any).userDepartmentId;
  // Query only data for user's department
});
```

### Frontend: Checking Permissions

```typescript
import { useRBAC, usePermission, useHasRole } from '@/hooks/useRBAC';

function MyComponent() {
  const rbac = useRBAC();
  
  // Check if loading
  if (rbac.loading) return <Loading />;
  
  // Check if user is admin
  if (rbac.isAdmin) {
    return <AdminPanel />;
  }
  
  // Check specific permission
  const canEditUsers = rbac.can('users', 'update');
  
  // Check role
  const isManager = rbac.hasRole('department_manager');
  
  // Check hierarchy level
  const canApprove = rbac.hasSufficientLevel(5); // Manager and above
}
```

### Frontend: Route Guards

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const response = await apiClient.get<{ roles: string[] }>("/auth/profile");
    const roles = response.data?.roles || [];
    const allowed = ["super_administrator", "system_administrator", "it_support"];
    if (!roles.some(r => allowed.includes(r))) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});
```

## Database Schema Changes

### Updated Enum: `AppRole`
```prisma
enum AppRole {
  super_administrator
  system_administrator
  executive
  department_manager
  department_supervisor
  approver
  employee
  hr_officer
  gad
  security_guard
  purchasing_officer
  warehouse_officer
  vehicle_coordinator
  it_support
  auditor
}
```

### Seed Data
- **100+ permissions** across all modules
- **Role-permission mappings** for all 15 roles
- **13 departments** (Executive, Admin, HR, Engineering, QA, Production, Warehouse, Purchasing, Security, GAD, IT, Finance, Vehicle Pool)
- **7 control number settings** (Gate Pass, MRF, Leave, Visitor, Vehicle, Asset, Purchase Request)
- **Default admin user:** admin@hst.com / admin123

## Permission Matrix (Summary)

| Module | Employee | Supervisor | Manager | GAD | HR | Security | Executive | Admin |
|--------|----------|------------|---------|-----|-----|----------|-----------|-------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gate Pass | Create | Approve | Approve | Final | View | Release | View | Full |
| Leave | Create | Recommend | Approve | View | Final | - | View | Full |
| MRF | Create | Approve | Approve | View | View | - | View | Full |
| Purchase Request | Create | Approve | Approve | View | View | - | View | Full |
| Visitor | Create | View | View | View | Manage | Check-in | View | Full |
| Vehicles | Request | View | View | Manage | View | Verify | View | Full |
| Assets | Borrow | Approve | Approve | View | View | - | View | Full |
| Reports | Own | Team | Department | Department | HR | Daily | Company | All |
| Audit Logs | ✗ | ✗ | ✗ | View | View | View | View | Full |
| Users & Roles | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | Full |

## Next Steps

1. **Complete Security Pages:**
   - Gate pass release page with confirmation
   - Vehicle logs page
   - Time logs (time in/out)

2. **Complete Admin Pages:**
   - Departments management
   - Control numbers settings
   - System settings
   - Audit logs viewer

3. **Approval Workflow Engine:**
   - Implement role-based step routing
   - Auto-assign approvers based on department + role
   - Email notifications for approvals

4. **Audit Logging:**
   - Log all role/permission changes
   - Track user actions
   - Export functionality

5. **Testing:**
   - Test each role's access
   - Verify hierarchy bypass works
   - Test department scoping
   - Verify security guard isolation

## Migration Guide

### For Existing Users

1. Run the updated seed script:
   ```bash
   cd backend
   npm run db:seed
   ```

2. The seed script will:
   - Create all new permissions
   - Assign permissions to roles
   - Create departments
   - Create default admin user

3. Assign roles to existing users:
   ```typescript
   // Via API
   POST /api/roles
   { user_id: "user-id", role: "employee" }
   ```

### For New Users

Users are created with the `employee` role by default. Administrators can assign additional roles via the admin panel.

## Security Considerations

1. **Super Administrator** role should be limited to 1-2 people
2. **Role assignments** are logged in audit trail
3. **Department scoping** prevents data leakage between departments
4. **Permission checks** happen on every request
5. **JWT tokens** include user ID; roles/permissions fetched from DB on each request
6. **Inactive accounts** cannot authenticate

## Troubleshooting

### Route not found errors
Run route generation:
```bash
npx @tanstack/router-cli generate
```

### Permission denied errors
Check user's roles in database:
```sql
SELECT p.email, ur.role 
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
WHERE p.email = 'user@example.com';
```

### TypeScript errors in route tree
The route tree is auto-generated. After adding new routes, regenerate it or restart the dev server.