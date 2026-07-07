import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default permissions
  const permissions = [
    { module: 'departments', action: 'read', description: 'View departments' },
    { module: 'departments', action: 'create', description: 'Create departments' },
    { module: 'departments', action: 'update', description: 'Update departments' },
    { module: 'departments', action: 'delete', description: 'Delete departments' },
    { module: 'positions', action: 'read', description: 'View positions' },
    { module: 'positions', action: 'create', description: 'Create positions' },
    { module: 'positions', action: 'update', description: 'Update positions' },
    { module: 'positions', action: 'delete', description: 'Delete positions' },
    { module: 'profiles', action: 'read', description: 'View employee profiles' },
    { module: 'profiles', action: 'create', description: 'Create employee profiles' },
    { module: 'profiles', action: 'update', description: 'Update employee profiles' },
    { module: 'profiles', action: 'delete', description: 'Delete employee profiles' },
    { module: 'roles', action: 'read', description: 'View roles' },
    { module: 'roles', action: 'create', description: 'Assign roles' },
    { module: 'roles', action: 'delete', description: 'Remove roles' },
    { module: 'permissions', action: 'read', description: 'View permissions' },
    { module: 'permissions', action: 'create', description: 'Manage permissions' },
    { module: 'permissions', action: 'delete', description: 'Remove permissions' },
    { module: 'approval_workflows', action: 'read', description: 'View workflows' },
    { module: 'approval_workflows', action: 'create', description: 'Create workflows' },
    { module: 'approval_workflows', action: 'update', description: 'Update workflows' },
    { module: 'approval_workflows', action: 'delete', description: 'Delete workflows' },
    { module: 'approval_requests', action: 'read', description: 'View approval requests' },
    { module: 'approval_requests', action: 'create', description: 'Create approval requests' },
    { module: 'approval_requests', action: 'update', description: 'Update approval requests' },
    { module: 'notifications', action: 'read', description: 'View notifications' },
    { module: 'notifications', action: 'update', description: 'Update notifications' },
    { module: 'notifications', action: 'delete', description: 'Delete notifications' },
    { module: 'audit_logs', action: 'read', description: 'View audit logs' },
    { module: 'control_numbers', action: 'read', description: 'View control numbers' },
    { module: 'control_numbers', action: 'create', description: 'Create control numbers' },
    { module: 'control_numbers', action: 'update', description: 'Update control numbers' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { module_action: { module: p.module, action: p.action } },
      update: {},
      create: p,
    });
  }

  console.log(`Created ${permissions.length} permissions`);

  // Assign all permissions to administrator role
  const allPermissions = await prisma.permission.findMany();
  for (const p of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { role_permission_id: { role: 'administrator', permission_id: p.id } },
      update: {},
      create: { role: 'administrator', permission_id: p.id },
    });
  }

  console.log('Assigned all permissions to administrator role');

  // Create default departments
  const departments = [
    { code: 'ADMIN', name: 'Administration', description: 'Administrative department' },
    { code: 'HR', name: 'Human Resources', description: 'HR department' },
    { code: 'ENG', name: 'Engineering', description: 'Engineering department' },
    { code: 'QA', name: 'Quality Assurance', description: 'QA department' },
    { code: 'PROD', name: 'Production', description: 'Production department' },
    { code: 'WH', name: 'Warehouse', description: 'Warehouse department' },
    { code: 'PUR', name: 'Purchasing', description: 'Purchasing department' },
    { code: 'SEC', name: 'Security', description: 'Security department' },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }

  console.log(`Created ${departments.length} departments`);

  // Create default control number settings
  const controlNumbers = [
    { module: 'gate_pass', prefix: 'GP', padding: 6, format_template: 'GP-{YYYY}-{SEQ}', year: new Date().getFullYear() },
    { module: 'mrf', prefix: 'MRF', padding: 6, format_template: 'MRF-{YYYY}-{SEQ}', year: new Date().getFullYear() },
    { module: 'leave', prefix: 'LV', padding: 6, format_template: 'LV-{YYYY}-{SEQ}', year: new Date().getFullYear() },
    { module: 'visitor', prefix: 'VIS', padding: 6, format_template: 'VIS-{YYYY}-{SEQ}', year: new Date().getFullYear() },
    { module: 'vehicle', prefix: 'VEH', padding: 6, format_template: 'VEH-{YYYY}-{SEQ}', year: new Date().getFullYear() },
    { module: 'asset', prefix: 'AST', padding: 6, format_template: 'AST-{YYYY}-{SEQ}', year: new Date().getFullYear() },
    { module: 'purchase_request', prefix: 'PR', padding: 6, format_template: 'PR-{YYYY}-{SEQ}', year: new Date().getFullYear() },
  ];

  for (const c of controlNumbers) {
    await prisma.controlNumberSetting.upsert({
      where: { module: c.module },
      update: {},
      create: c,
    });
  }

  console.log(`Created ${controlNumbers.length} control number settings`);

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });