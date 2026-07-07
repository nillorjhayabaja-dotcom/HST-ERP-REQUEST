# Gate Pass Module - Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 12+ running
- Git (optional)

## Step 1: Database Migration

```bash
cd backend

# Generate Prisma Client (already done)
npx prisma generate

# Create and run migration
npx prisma migrate dev --name init_gate_passes
```

## Step 2: Seed Database

```bash
# Seed gate pass types and sample data
npx prisma db seed
```

If you get an error about seed command not found, add this to your `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed-gate-passes.ts"
  }
}
```

## Step 3: Configure Permissions

Run this SQL in your PostgreSQL database to add gate pass permissions:

```sql
-- Insert gate_passes permissions
INSERT INTO permissions (module, action, description) VALUES
('gate_passes', 'create', 'Create gate passes'),
('gate_passes', 'read', 'View gate passes'),
('gate_passes', 'update', 'Update gate passes'),
('gate_passes', 'delete', 'Delete gate passes'),
('gate_passes', 'approve', 'Approve gate passes'),
('gate_passes', 'reject', 'Reject gate passes')
ON CONFLICT (module, action) DO NOTHING;

-- Assign permissions to roles (adjust as needed)
-- Administrators get all permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'administrator', id FROM permissions WHERE module = 'gate_passes'
ON CONFLICT DO NOTHING;

-- Employees can create and read their own
INSERT INTO role_permissions (role, permission_id)
SELECT 'employee', id FROM permissions WHERE module = 'gate_passes' AND action IN ('create', 'read')
ON CONFLICT DO NOTHING;

-- Department heads can approve
INSERT INTO role_permissions (role, permission_id)
SELECT 'department_head', id FROM permissions WHERE module = 'gate_passes' AND action IN ('read', 'approve', 'reject')
ON CONFLICT DO NOTHING;

-- Security can release and return
INSERT INTO role_permissions (role, permission_id)
SELECT 'security', id FROM permissions WHERE module = 'gate_passes' AND action IN ('read', 'update')
ON CONFLICT DO NOTHING;
```

## Step 4: Start Backend Server

```bash
cd backend
npm run dev
```

The backend should now be running on `http://localhost:3001`

## Step 5: Start Frontend Development Server

Open a new terminal:

```bash
npm run dev
```

The frontend should now be running on `http://localhost:5173`

## Step 6: Access the Application

1. Open your browser and go to `http://localhost:5173`
2. Login with your existing credentials
3. Click on "Gate Pass" in the sidebar navigation
4. You should see the Gate Pass Management page

## Step 7: Test the Workflow

### As an Employee:
1. Click "New Gate Pass" button
2. Fill in the form:
   - Select gate pass type
   - Enter departure/return dates and times
   - Enter destination and purpose
   - Select vehicle type
   - Enter vehicle details if applicable
3. Click "Create Gate Pass"
4. Click "Submit" to submit for approval

### As an Approver:
1. Go to Approvals page (or implement approval queue)
2. Find the pending gate pass
3. Review and Approve/Reject

### As Security:
1. After approval, go to gate pass details
2. Generate QR code
3. Print gate pass
4. When employee returns, scan QR code
5. Record return

## Troubleshooting

### Issue: "Property 'gatePass' does not exist"
**Solution**: Run `npx prisma generate` in the backend directory

### Issue: "Cannot find module"
**Solution**: 
```bash
cd backend
npm install
```

### Issue: Database connection error
**Solution**: Check your `backend/.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/hst_erp"
```

### Issue: Permission denied errors
**Solution**: Run the SQL commands in Step 3 to add permissions

### Issue: Prisma generate fails with EPERM
**Solution**: 
1. Close any open database connections (Prisma Studio, etc.)
2. Restart your IDE/editor
3. Run `npx prisma generate` again

## Verification Checklist

- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Can login to the application
- [ ] Can see "Gate Pass" in sidebar
- [ ] Can navigate to `/gate-passes` page
- [ ] Page loads with statistics cards
- [ ] Can click "New Gate Pass" button
- [ ] Form opens with all fields
- [ ] Can create a gate pass
- [ ] Gate pass appears in the list
- [ ] Can submit gate pass for approval

## Next Steps

1. **Configure Approval Workflows**: Set up approval workflows in the admin panel
2. **Assign Roles**: Ensure users have appropriate roles (employee, department_head, security)
3. **Test QR Codes**: Generate and test QR code scanning
4. **Configure Printers**: Set up browser printing for gate passes
5. **Train Users**: Train employees, approvers, and security staff

## Support

If you encounter issues:
1. Check the browser console for frontend errors
2. Check the backend terminal for API errors
3. Review the database logs
4. Consult `GATE_PASS_MODULE_DOCUMENTATION.md` for detailed information

## Production Deployment

Before deploying to production:

1. **Environment Variables**: Set production values in `.env`
2. **Database**: Run migrations on production database
3. **Seed Data**: Add production gate pass types
4. **Permissions**: Configure role-based permissions
5. **SSL**: Enable HTTPS
6. **Backup**: Set up database backups
7. **Monitoring**: Configure error tracking and logging
8. **Performance**: Enable caching and optimize queries

## File Changes Summary

### New Files Created:
- `backend/prisma/schema.prisma` (extended)
- `backend/prisma/seed-gate-passes.ts`
- `backend/controllers/gate-passes.controller.ts`
- `backend/src/routes/gate-passes.routes.ts`
- `backend/utils/audit.ts`
- `backend/utils/notifications.ts`
- `src/routes/_authenticated/gate-passes.tsx`
- `GATE_PASS_MODULE_DOCUMENTATION.md`
- `GATE_PASS_IMPLEMENTATION_SUMMARY.md`
- `SETUP_GUIDE.md`

### Modified Files:
- `backend/src/routes/index.ts` (added gate passes routes)
- `src/components/app-sidebar.tsx` (updated navigation)
- `backend/package.json` (added qrcode dependency)

## Success Indicators

✅ All TypeScript errors resolved
✅ Backend server runs without errors
✅ Frontend compiles without errors
✅ Database tables created successfully
✅ Can create, view, and submit gate passes
✅ Navigation works correctly
✅ Statistics display correctly

---

**Status**: Ready for deployment after completing the setup steps above.