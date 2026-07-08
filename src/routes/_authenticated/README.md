# Authenticated Routes Structure

This directory contains all routes that require user authentication. The routes are organized into three main categories for better maintainability and scalability.

## Folder Structure

```
_authenticated/
├── route.tsx              # Main layout component with sidebar and top bar
├── admin/                 # Admin portal routes (Administration module)
│   ├── control-numbers.tsx
│   ├── departments.tsx
│   ├── settings.tsx
│   ├── users.tsx
│   └── workflows.tsx
├── employee/              # Employee portal routes (Employee self-service)
│   ├── employees.tsx
│   ├── gate-pass.tsx
│   ├── gate-passes.tsx
│   ├── leave.tsx
│   ├── mrf.tsx
│   ├── visitors.tsx
│   ├── vehicles.tsx
│   ├── assets.tsx
│   └── purchase-requests.tsx
└── shared/                # Shared routes (accessible by all roles)
    ├── approvals.tsx
    ├── audit-logs.tsx
    ├── dashboard.tsx
    ├── notifications.tsx
    ├── profile.tsx
    └── reports.tsx
```

## Route Categories

### 1. Admin Portal (`/admin/*`)
Routes for system administration and management. These are typically only accessible by users with administrator roles.

**Access Control:** Administrator, HR Manager, System Admin

**Routes:**
- `/admin/control-numbers` - Control number configuration
- `/admin/departments` - Department management
- `/admin/settings` - System settings
- `/admin/users` - User management and role assignment
- `/admin/workflows` - Approval workflow configuration

### 2. Employee Portal (`/employee/*`)
Routes for employee self-service and daily operations. Accessible by all authenticated users.

**Access Control:** All authenticated users

**Routes:**
- `/employees` - Employee directory
- `/gate-pass` - Create new gate pass
- `/gate-passes` - View gate pass history
- `/leave` - Leave management
- `/mrf` - Material Requisition Form
- `/visitors` - Visitor management
- `/vehicles` - Vehicle management
- `/assets` - Asset management
- `/purchase-requests` - Purchase request management

### 3. Shared Routes (`/*`)
Routes that are shared across all user types and don't fit into specific portals.

**Access Control:** All authenticated users

**Routes:**
- `/` - Dashboard (home)
- `/approvals` - Approval requests
- `/audit-logs` - System audit trail
- `/notifications` - User notifications
- `/profile` - User profile management
- `/reports` - Reports and analytics

## Adding New Routes

### For Admin Portal
1. Create a new file in `admin/` folder (e.g., `admin/new-feature.tsx`)
2. Use the route pattern: `createFileRoute("/_authenticated/admin/new-feature")`
3. Implement role-based access control in the component

### For Employee Portal
1. Create a new file in `employee/` folder (e.g., `employee/new-feature.tsx`)
2. Use the route pattern: `createFileRoute("/_authenticated/employee/new-feature")`
3. Ensure proper authentication checks

### For Shared Routes
1. Create a new file in `shared/` folder (e.g., `shared/new-feature.tsx`)
2. Use the route pattern: `createFileRoute("/_authenticated/new-feature")`
3. Make it accessible to all authenticated users

## Route Naming Convention

- Use kebab-case for file names (e.g., `gate-passes.tsx`)
- Use plural nouns for list views (e.g., `users.tsx`, `departments.tsx`)
- Use singular nouns for detail/create views (e.g., `gate-pass.tsx`)
- Prefix admin routes with `admin.` (automatically handled by folder structure)

## Example Route Definition

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users & Roles — HST Admin" }] }),
  component: UsersAdmin,
});

function UsersAdmin() {
  // Component implementation
}
```

## Notes for Developers

1. **Route URLs remain unchanged**: Moving files to subfolders doesn't affect the URL structure. The route path in `createFileRoute` determines the URL, not the file location.

2. **Auto-generated route tree**: The `routeTree.gen.ts` file is auto-generated. After adding new routes, run `npm run build` to regenerate it.

3. **Access Control**: Implement role-based access control in each component using the `useAuth()` hook and role checking utilities from `@/lib/rbac`.

4. **Shared Components**: Place reusable components in `src/components/` and import them as needed.

5. **API Calls**: Use the `apiClient` from `@/lib/api-client` for all API requests.

## Migration from Flat Structure

The routes were previously flat in the `_authenticated/` folder. They have been organized into:
- `admin/` - Administration features
- `employee/` - Employee self-service features  
- `shared/` - Common features for all users

This organization makes it easier to:
- Find related routes
- Understand the application structure
- Scale the application as new features are added
- Assign access controls based on user roles