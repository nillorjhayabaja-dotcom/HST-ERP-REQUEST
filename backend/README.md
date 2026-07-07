# HST ERP Backend

Express.js REST API backend for HST Enterprise Portal.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secrets
```

3. Set up PostgreSQL database:
```bash
# Create database
createdb hst_erp

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

4. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update current user profile

### Departments
- `GET /api/departments` - List all departments
- `GET /api/departments/:id` - Get department details
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Soft delete department

### Profiles (Employees)
- `GET /api/profiles` - List all profiles (with pagination)
- `GET /api/profiles/:id` - Get profile details
- `POST /api/profiles` - Create profile
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Soft delete profile

### Positions
- `GET /api/positions` - List all positions
- `GET /api/positions/:id` - Get position details
- `POST /api/positions` - Create position
- `PUT /api/positions/:id` - Update position
- `DELETE /api/positions/:id` - Soft delete position

### Roles & Permissions
- `GET /api/roles` - List all roles
- `POST /api/roles` - Assign role to user
- `DELETE /api/roles/:id` - Remove role from user
- `GET /api/permissions` - List all permissions
- `POST /api/permissions` - Create permission
- `POST /api/permissions/assign` - Assign permission to role

### Approval Workflows
- `GET /api/approval-workflows` - List workflows
- `GET /api/approval-workflows/:id` - Get workflow details
- `POST /api/approval-workflows` - Create workflow
- `PUT /api/approval-workflows/:id` - Update workflow
- `DELETE /api/approval-workflows/:id` - Delete workflow

### Approval Requests
- `GET /api/approval-requests` - List approval requests
- `GET /api/approval-requests/:id` - Get request details
- `POST /api/approval-requests` - Create approval request
- `PUT /api/approval-requests/:id` - Update request
- `POST /api/approval-requests/:id/approve` - Approve request
- `POST /api/approval-requests/:id/reject` - Reject request

### Notifications
- `GET /api/notifications` - List user notifications
- `GET /api/notifications/:id` - Get notification details
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Audit Logs
- `GET /api/audit-logs` - List audit logs (with filters)
- `GET /api/audit-logs/:id` - Get audit log details

### Control Numbers
- `GET /api/control-numbers` - List control number settings
- `GET /api/control-numbers/:module` - Get setting for module
- `POST /api/control-numbers` - Create control number setting
- `PUT /api/control-numbers/:id` - Update control number setting

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Access tokens expire in 15 minutes. Use the refresh token endpoint to get a new access token.

## Role-Based Access Control

The system uses role-based access control with the following roles:
- administrator
- hr
- security
- engineering
- qa
- production
- warehouse
- purchasing
- accounting
- maintenance
- department_head
- employee
- executive
- it_administrator

Permissions are assigned to roles, and users can have multiple roles.

## Database Schema

See `prisma/schema.prisma` for the complete database schema.

## Development

### Running migrations:
```bash
npm run db:migrate
```

### Seeding database:
```bash
npm run db:seed
```

### Viewing database:
```bash
npm run db:studio
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set environment variables for production

3. Run database migrations:
```bash
npm run db:migrate
```

4. Start the server:
```bash
npm start
```

## License

Proprietary - HS Technologies (Phils.), Inc.