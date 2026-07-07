# HST Enterprise Portal - Migration Report

## Executive Summary
This report documents the complete migration of the HST Enterprise Portal from Lovable/Supabase to a self-hosted enterprise application using Node.js, Express, PostgreSQL, and Prisma ORM.

## Current Architecture Analysis

### Frontend Stack
- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 8.0.16
- **Routing**: TanStack Router 1.170.16
- **State Management**: TanStack Query 5.101.1
- **UI Framework**: Shadcn/UI with TailwindCSS 4.2.1
- **Icons**: Lucide React 0.575.0

### Current Backend (Cloud)
- **Backend**: Supabase (Lovable Cloud)
- **Database**: PostgreSQL (Supabase managed)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Edge Functions

## Database Schema Analysis

### Tables Identified
1. **profiles** - Employee/user profiles with department/position relationships
2. **departments** - Organizational departments (hierarchical)
3. **positions** - Job positions linked to departments
4. **user_roles** - User role assignments (RBAC)
5. **role_permissions** - Role-permission mappings
6. **permissions** - Permission definitions
7. **approval_workflows** - Approval workflow definitions
8. **approval_workflow_steps** - Workflow step definitions
9. **approval_requests** - Approval request instances
10. **approval_actions** - Approval action history
11. **notifications** - User notifications
12. **audit_logs** - Immutable audit trail
13. **control_number_settings** - Control number generation configs

### Enums
- **app_role**: administrator, hr, security, engineering, qa, production, warehouse, purchasing, accounting, maintenance, department_head, employee, executive, it_administrator
- **approval_status**: draft, pending, in_progress, approved, rejected, cancelled, completed
- **notification_type**: info, success, warning, error, approval, system

### Database Functions
- `has_permission(_action, _module, _user_id)` - Check user permissions
- `has_role(_role, _user_id)` - Check user roles
- `is_admin(_user_id)` - Check if user is admin
- `next_control_number(_module)` - Generate next control number

## Routes & Modules

### Public Routes
- `/auth` - Login/Signup page

### Authenticated Routes
**Workspace:**
- `/dashboard` - Executive dashboard with KPIs
- `/notifications` - Notification center
- `/profile` - User profile management

**Modules:**
- `/employees` - Employee management
- `/gate-pass` - Gate pass management
- `/mrf` - Material Requisition Forms
- `/leave` - Leave management
- `/visitors` - Visitor management
- `/vehicles` - Vehicle management
- `/assets` - Asset management
- `/purchase-requests` - Purchase request management

**Oversight:**
- `/approvals` - Approval workflow interface
- `/reports` - Reports and analytics
- `/audit-logs` - Audit trail viewer

**Administration:**
- `/admin/users` - User management
- `/admin/departments` - Department management
- `/admin/workflows` - Workflow configuration
- `/admin/control-numbers` - Control number settings
- `/admin/settings` - System settings

## Supabase Dependencies Identified

### Client-Side
- `src/integrations/supabase/client.ts` - Main Supabase client
- `src/integrations/supabase/client.server.ts` - Server-side client
- `src/integrations/supabase/auth-middleware.ts` - Authentication middleware
- `src/integrations/supabase/auth-attacher.ts` - Auth state attacher

### Usage Patterns
1. **Authentication**: `supabase.auth.signInWithPassword()`, `supabase.auth.signUp()`, `supabase.auth.getUser()`, `supabase.auth.onAuthStateChange()`
2. **Database Queries**: `supabase.from("table").select()`, `.eq()`, `.order()`, `.limit()`, `.maybeSingle()`
3. **Real-time**: Auth state change listeners

## Migration Strategy

### Phase 1: Backend Setup
1. Create backend directory structure
2. Set up Express.js server
3. Configure PostgreSQL with Prisma ORM
4. Implement JWT authentication
5. Create RBAC middleware

### Phase 2: Database Migration
1. Generate Prisma schema from Supabase types
2. Create migration scripts
3. Generate seed data
4. Migrate all database functions

### Phase 3: API Development
1. Create REST API endpoints for all modules
2. Implement authentication routes
3. Implement CRUD operations for all tables
4. Add file upload support

### Phase 4: Frontend Migration
1. Create API service layer
2. Replace Supabase client calls
3. Update authentication flow
4. Test all routes and components

### Phase 5: Testing & Deployment
1. Test all functionality
2. Create deployment scripts
3. Configure reverse proxy (Nginx/IIS)
4. Document deployment process

## Risk Assessment

### Low Risk
- UI components (no changes needed)
- Routing structure (minimal changes)
- Business logic (preserved in frontend)

### Medium Risk
- Authentication flow (needs reimplementation)
- Database queries (need Prisma conversion)
- File uploads (need local storage)

### High Risk
- Real-time features (if any)
- Edge functions (need server-side implementation)
- Data migration (if existing data exists)

## Estimated Effort
- Backend Development: 40-50 hours
- Frontend Migration: 20-30 hours
- Testing: 10-15 hours
- Documentation: 5-10 hours
- **Total: 75-105 hours**

## Next Steps
1. ✅ Complete analysis
2. Create backend directory structure
3. Set up Prisma schema
4. Implement authentication
5. Build API endpoints
6. Migrate frontend
7. Test thoroughly
8. Deploy to production

## Notes
- All existing UI components will be preserved
- All business logic remains in frontend
- Only data layer and authentication will change
- Users should not notice any difference post-migration