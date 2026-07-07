# Gate Pass Management System - Module Documentation

## Overview

The Gate Pass Management System is Module 1 of the HST Enterprise Portal, designed to digitize the paper-based gate pass process for HS Technologies (Phils.), Inc. This module eliminates handwritten forms and automatically generates printable gate passes after all required approvals are completed.

## Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **ORM**: Prisma 6.x
- **Authentication**: JWT with bcrypt
- **Validation**: Zod
- **File Upload**: Multer
- **QR Code**: qrcode library
- **Database**: PostgreSQL

### Frontend
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod

## Architecture

### Database Schema

The Gate Pass module extends the existing HST ERP database with the following models:

#### Core Models
- **GatePassType**: Defines different types of gate passes (Official Business, Personal, Material Out, etc.)
- **GatePass**: Main entity containing all gate pass information
- **GatePassApproval**: Tracks approval actions for each gate pass
- **GatePassStatusHistory**: Records all status changes
- **GatePassVehicle**: Stores vehicle information for company/private vehicles
- **GatePassLog**: Audit trail for all gate pass activities
- **GatePassAttachment**: File attachments for gate passes
- **GatePassPrintLog**: Tracks printing activities

#### Key Features
- **Soft Deletes**: All records support soft deletion
- **Audit Trail**: Complete history of all changes
- **Status Tracking**: Comprehensive status workflow
- **QR Code Integration**: Unique QR codes for security verification
- **Control Numbers**: Auto-generated sequential control numbers

### Status Workflow

```
Draft → Submitted → For Supervisor Approval → For Department Head Approval 
→ For Vehicle Coordinator Approval (if applicable) → For General Administration Approval 
→ Approved → Released → Returned → Completed

Alternative paths:
→ Rejected
→ Cancelled
→ Expired
```

### Approval Workflow

The approval process is configurable through the database:

1. **Employee** creates gate pass
2. **Immediate Supervisor** reviews
3. **Department Head** reviews
4. **Car Assignee/Vehicle Coordinator** (only if company vehicle)
5. **General Administration** reviews
6. **Security** receives final approved pass

Each approver can:
- Approve
- Reject
- Return for Revision
- Add Remarks

## File Structure

```
backend/
├── prisma/
│   ├── schema.prisma                 # Database schema with Gate Pass models
│   └── seed-gate-passes.ts           # Seed data for gate passes
├── src/
│   ├── controllers/
│   │   └── gate-passes.controller.ts # Business logic for gate passes
│   ├── routes/
│   │   ├── index.ts                  # Route registry (updated)
│   │   └── gate-passes.routes.ts     # API endpoints
│   ├── utils/
│   │   ├── audit.ts                  # Audit logging utility
│   │   └── notifications.ts          # Notification utility
│   └── config/
│       └── database.ts               # Prisma client configuration

frontend/
└── src/
    ├── routes/
    │   └── _authenticated/
    │       └── gate-passes.tsx        # Main gate pass page
    └── components/
        └── app-sidebar.tsx           # Navigation (updated)
```

## API Endpoints

### Gate Passes
- `GET /api/gate-passes` - List all gate passes (with filtering)
- `GET /api/gate-passes/:id` - Get single gate pass
- `POST /api/gate-passes` - Create new gate pass
- `PUT /api/gate-passes/:id` - Update gate pass
- `DELETE /api/gate-passes/:id` - Soft delete gate pass
- `POST /api/gate-passes/:id/submit` - Submit for approval
- `POST /api/gate-passes/:id/qr-code` - Generate QR code
- `POST /api/gate-passes/:id/release` - Release employee (security)
- `POST /api/gate-passes/:id/return` - Record return (security)
- `POST /api/gate-passes/verify-qr` - Verify QR code
- `GET /api/gate-passes/types` - Get gate pass types
- `GET /api/gate-passes/dashboard/stats` - Get dashboard statistics

## Frontend Features

### Gate Pass Management Page (`/gate-passes`)

#### Statistics Dashboard
- Pending Requests
- Approved Today
- Released Employees
- Pending Approvals

#### Gate Pass List
- Tabbed interface (All, Draft, Submitted, Approved, Released, Completed)
- Searchable and filterable
- Status badges with color coding
- Quick actions (View, Submit)

#### Create Gate Pass Form
- Dynamic form based on gate pass type
- Auto-populated employee information
- Smart field visibility:
  - Company Vehicle: Shows plate number, driver info
  - Private Vehicle: Shows plate number only
  - Public Transport/Walking: Hides vehicle fields
- Date and time pickers
- Destination and purpose fields
- Optional remarks

#### View Gate Pass Dialog
- Complete gate pass details
- Employee information
- Trip details
- Vehicle information
- Status history
- Approval chain

## Security Features

### Authentication
- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based authorization

### Authorization
- Employees can create/view their own gate passes
- Supervisors can approve subordinate requests
- Department heads can approve department requests
- Security can release/return gate passes
- Administrators have full access

### Audit Logging
- All actions are logged with:
  - User ID
  - Action performed
  - Timestamp
  - IP Address
  - User Agent
  - Old and new values (for updates)

## QR Code Integration

### Generation
- QR codes are generated after final approval
- Contains encrypted gate pass data:
  - Gate Pass ID
  - Control Number
  - Employee ID
  - Status
  - Generation timestamp

### Verification
- Security guards scan QR codes
- System validates:
  - Gate pass exists
  - Status is valid (approved/released)
  - Not expired, cancelled, or completed
  - Not already used

## Printable Gate Pass

### Features
- Professional layout with company branding
- A4 and Half Letter support
- PDF export capability
- Browser printing support
- Includes:
  - Company Logo and Name
  - Control Number (barcode-ready)
  - Employee Information
  - Trip Details
  - Vehicle Information
  - Approval Summary
  - QR Code
  - Footer with "System Generated" notice

## Notifications

### Automated Notifications
- Gate pass submitted
- Approval granted
- Approval rejected
- Returned for revision
- Gate pass released
- Gate pass completed

### Notification Types
- Info
- Success
- Warning
- Error
- Approval
- System

## Reports

### Available Reports
- By Department
- By Employee
- By Date Range
- By Destination
- By Purpose
- By Vehicle
- By Status
- By Approver

### Export Formats
- Excel (CSV)
- PDF
- Print

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Generate Prisma Client**
```bash
npx prisma generate
```

3. **Run Database Migration**
```bash
npx prisma migrate dev --name init_gate_passes
```

4. **Seed Database**
```bash
# Seed gate pass types and control numbers
npx prisma db seed
```

5. **Start Development Server**
```bash
npm run dev
```

### Frontend Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

3. **Access Application**
```
http://localhost:5173
```

## Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hst_erp"
JWT_SECRET="your-jwt-secret-key"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

### Control Number Configuration

Control numbers are configured in the `control_number_settings` table:

```json
{
  "module": "gate_passes",
  "prefix": "GP",
  "padding": 6,
  "next_sequence": 1,
  "format_template": "{PREFIX}-{YEAR}-{SEQUENCE}",
  "year": 2026
}
```

This generates control numbers like: `GP-2026-000001`

## Business Rules

### Gate Pass Creation
- Employees can create gate passes in draft status
- Control numbers are auto-generated on creation
- Employee information is auto-populated from profile

### Approval Rules
- Gate passes require approval before release
- Company vehicle requests require vehicle coordinator approval
- Approvers can only approve requests in their queue
- Rejected passes return to employee for revision

### Security Rules
- Only approved gate passes can be released
- QR codes are single-use
- Gate passes expire based on expected return time
- Security must record actual time out/in

### Vehicle Rules
- Company vehicles cannot be double-booked
- Vehicle information is locked after approval
- Mileage is recorded at start and end of trip

## Integration Points

### Existing Systems
- **Employee Management**: Uses existing Profile and Department models
- **Approval Engine**: Extends existing ApprovalWorkflow system
- **Notifications**: Uses existing Notification model
- **Audit Logs**: Uses existing AuditLog model
- **Control Numbers**: Uses existing ControlNumberSetting model

### Future Integrations
- **Vehicle Monitoring Module**: Real-time GPS tracking
- **Biometric Integration**: Fingerprint/facial recognition at gates
- **Camera Integration**: Photo capture at gate
- **ERP Modules**: Link to MRF, Leave, and other modules

## Testing

### Manual Testing Checklist

#### Employee Flow
- [ ] Create gate pass as draft
- [ ] Submit for approval
- [ ] View status changes
- [ ] Receive notifications

#### Approver Flow
- [ ] View pending approvals
- [ ] Approve request
- [ ] Reject request
- [ ] Return for revision

#### Security Flow
- [ ] Scan QR code
- [ ] Verify gate pass
- [ ] Release employee
- [ ] Record return

## Troubleshooting

### Common Issues

1. **Prisma Generate Fails**
   - Close any open database connections
   - Restart IDE/editor
   - Run `npx prisma generate` again

2. **Permission Errors**
   - Ensure database user has proper grants
   - Check DATABASE_URL in .env

3. **QR Code Not Generating**
   - Verify qrcode package is installed
   - Check gate pass status is "approved"

4. **Control Numbers Duplicate**
   - Check control_number_settings table
   - Verify next_sequence is correct

## Performance Considerations

### Database Indexes
- Control number (unique)
- Employee ID
- Status
- Created at
- QR code data (unique)

### Caching Strategy
- TanStack Query for frontend caching
- Cache invalidation on mutations
- Stale-while-revalidate pattern

### Pagination
- Default 50 records per page
- Configurable limit
- Efficient count queries

## Security Considerations

### Data Protection
- Passwords hashed with bcrypt
- JWT tokens with expiration
- SQL injection prevention (Prisma ORM)
- XSS protection (React)

### Access Control
- Role-based permissions
- Resource-level authorization
- Audit trail for all actions

### QR Code Security
- Encrypted payload
- Time-limited validity
- Single-use enforcement

## Maintenance

### Regular Tasks
- Review and archive old gate passes
- Clean up expired QR codes
- Monitor audit logs
- Backup database

### Monitoring
- API response times
- Database query performance
- Error rates
- User activity

## Support

For issues or questions:
1. Check this documentation
2. Review audit logs
3. Check application logs
4. Contact system administrator

## Version History

### v1.0.0 (Current)
- Initial release
- Basic gate pass creation and approval
- QR code generation and verification
- Security guard module
- Dashboard statistics
- Audit logging
- Notification system

## License

Proprietary - HS Technologies (Phils.), Inc.