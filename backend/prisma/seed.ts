/// <reference types="node" />

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── Create all permissions ─────────────────────────────────────
  const permissions = [
    // Core system modules
    { module: "dashboard", action: "read", description: "View dashboard" },
    { module: "employees", action: "read", description: "View employees" },
    { module: "employees", action: "create", description: "Create employees" },
    { module: "employees", action: "update", description: "Update employees" },
    { module: "employees", action: "delete", description: "Delete employees" },
    { module: "departments", action: "read", description: "View departments" },
    { module: "departments", action: "create", description: "Create departments" },
    { module: "departments", action: "update", description: "Update departments" },
    { module: "departments", action: "delete", description: "Delete departments" },
    { module: "positions", action: "read", description: "View positions" },
    { module: "positions", action: "create", description: "Create positions" },
    { module: "positions", action: "update", description: "Update positions" },
    { module: "positions", action: "delete", description: "Delete positions" },
    { module: "profiles", action: "read", description: "View employee profiles" },
    { module: "profiles", action: "create", description: "Create employee profiles" },
    { module: "profiles", action: "update", description: "Update employee profiles" },
    { module: "profiles", action: "delete", description: "Delete employee profiles" },
    { module: "roles", action: "read", description: "View roles" },
    { module: "roles", action: "create", description: "Assign roles" },
    { module: "roles", action: "delete", description: "Remove roles" },
    { module: "permissions", action: "read", description: "View permissions" },
    { module: "permissions", action: "create", description: "Manage permissions" },
    { module: "permissions", action: "delete", description: "Remove permissions" },
    { module: "users", action: "read", description: "View users" },
    { module: "users", action: "create", description: "Create users" },
    { module: "users", action: "update", description: "Update users" },
    { module: "users", action: "delete", description: "Delete users" },
    { module: "users", action: "reset_password", description: "Reset user passwords" },
    { module: "users", action: "unlock_account", description: "Unlock user accounts" },

    // Approval Workflows
    { module: "approval_workflows", action: "read", description: "View workflows" },
    { module: "approval_workflows", action: "create", description: "Create workflows" },
    { module: "approval_workflows", action: "update", description: "Update workflows" },
    { module: "approval_workflows", action: "delete", description: "Delete workflows" },
    { module: "approval_requests", action: "read", description: "View approval requests" },
    { module: "approval_requests", action: "create", description: "Create approval requests" },
    { module: "approval_requests", action: "update", description: "Update approval requests" },
    { module: "approval_requests", action: "approve", description: "Approve requests" },

    // Notifications
    { module: "notifications", action: "read", description: "View notifications" },
    { module: "notifications", action: "update", description: "Update notifications" },
    { module: "notifications", action: "delete", description: "Delete notifications" },

    // Audit Logs
    { module: "audit_logs", action: "read", description: "View audit logs" },
    { module: "audit_logs", action: "export", description: "Export audit logs" },

    // Control Numbers
    { module: "control_numbers", action: "read", description: "View control numbers" },
    { module: "control_numbers", action: "create", description: "Create control numbers" },
    { module: "control_numbers", action: "update", description: "Update control numbers" },

    // Gate Pass
    { module: "gate_passes", action: "read", description: "View gate passes" },
    { module: "gate_passes", action: "create", description: "Create gate passes" },
    { module: "gate_passes", action: "update", description: "Update gate passes" },
    { module: "gate_passes", action: "delete", description: "Delete gate passes" },
    { module: "gate_passes", action: "approve", description: "Approve gate passes" },
    { module: "gate_passes", action: "release", description: "Release gate passes" },
    { module: "gate_passes", action: "verify_qr", description: "Verify gate pass QR codes" },
    {
      module: "gate_passes",
      action: "read_all",
      description: "View all gate passes across departments",
    },

    // Gate Pass Settings
    { module: "gate_pass_settings", action: "read", description: "View gate pass settings" },
    { module: "gate_pass_settings", action: "update", description: "Update gate pass settings" },

    // Leave
    { module: "leave", action: "read", description: "View leaves" },
    { module: "leave", action: "create", description: "Create leave requests" },
    { module: "leave", action: "update", description: "Update leave requests" },
    { module: "leave", action: "approve", description: "Approve leave requests" },
    { module: "leave", action: "read_all", description: "View all leaves" },

    // MRF
    { module: "mrf", action: "read", description: "View MRFs" },
    { module: "mrf", action: "create", description: "Create MRF requests" },
    { module: "mrf", action: "update", description: "Update MRF requests" },
    { module: "mrf", action: "approve", description: "Approve MRF requests" },
    { module: "mrf", action: "read_all", description: "View all MRFs" },

    // Purchase Request
    { module: "purchase_requests", action: "read", description: "View purchase requests" },
    { module: "purchase_requests", action: "create", description: "Create purchase requests" },
    { module: "purchase_requests", action: "update", description: "Update purchase requests" },
    { module: "purchase_requests", action: "approve", description: "Approve purchase requests" },
    { module: "purchase_requests", action: "read_all", description: "View all purchase requests" },

    // Visitors
    { module: "visitors", action: "read", description: "View visitors" },
    { module: "visitors", action: "create", description: "Create visitor entries" },
    { module: "visitors", action: "update", description: "Update visitor entries" },
    { module: "visitors", action: "check_in", description: "Check in visitors" },
    { module: "visitors", action: "check_out", description: "Check out visitors" },
    { module: "visitors", action: "read_all", description: "View all visitors" },

    // Vehicles
    { module: "vehicles", action: "read", description: "View vehicles" },
    { module: "vehicles", action: "create", description: "Create vehicle requests" },
    { module: "vehicles", action: "update", description: "Update vehicle records" },
    { module: "vehicles", action: "delete", description: "Delete vehicle records" },
    { module: "vehicles", action: "assign", description: "Assign vehicles" },
    { module: "vehicles", action: "manage", description: "Manage vehicles and drivers" },
    { module: "vehicles", action: "read_all", description: "View all vehicle requests" },

    // Assets
    { module: "assets", action: "read", description: "View assets" },
    { module: "assets", action: "create", description: "Create asset records" },
    { module: "assets", action: "update", description: "Update asset records" },
    { module: "assets", action: "delete", description: "Delete asset records" },
    { module: "assets", action: "borrow", description: "Borrow assets" },
    { module: "assets", action: "approve", description: "Approve asset borrowing" },
    { module: "assets", action: "read_all", description: "View all assets" },

    // Reports
    { module: "reports", action: "read_own", description: "View own reports" },
    { module: "reports", action: "read_team", description: "View team reports" },
    { module: "reports", action: "read_department", description: "View department reports" },
    { module: "reports", action: "read_company", description: "View company-wide reports" },
    { module: "reports", action: "export", description: "Export reports" },

    // System
    { module: "system", action: "read", description: "View system settings" },
    { module: "system", action: "update", description: "Update system settings" },
    { module: "system", action: "backup", description: "Backup database" },
    { module: "system", action: "manage_security", description: "Manage security settings" },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { module_action: { module: p.module, action: p.action } },
      update: {},
      create: p,
    });
  }

  console.log(`Created ${permissions.length} permissions`);

  // ── Role-Permission Mappings ─────────────────────────────────
  // Define which roles get which permissions
  const rolePermissions: Record<string, string[]> = {
    super_administrator: permissions.map((p) => `${p.module}:${p.action}`),
    system_administrator: [
      "dashboard:read",
      "employees:read",
      "employees:create",
      "employees:update",
      "employees:delete",
      "departments:read",
      "departments:create",
      "departments:update",
      "departments:delete",
      "positions:read",
      "positions:create",
      "positions:update",
      "positions:delete",
      "profiles:read",
      "profiles:create",
      "profiles:update",
      "profiles:delete",
      "roles:read",
      "roles:create",
      "roles:delete",
      "permissions:read",
      "permissions:create",
      "permissions:delete",
      "users:read",
      "users:create",
      "users:update",
      "users:delete",
      "users:reset_password",
      "users:unlock_account",
      "approval_workflows:read",
      "approval_workflows:create",
      "approval_workflows:update",
      "approval_workflows:delete",
      "approval_requests:read",
      "approval_requests:create",
      "approval_requests:update",
      "approval_requests:approve",
      "notifications:read",
      "notifications:update",
      "notifications:delete",
      "audit_logs:read",
      "audit_logs:export",
      "control_numbers:read",
      "control_numbers:create",
      "control_numbers:update",
      "gate_passes:read",
      "gate_passes:create",
      "gate_passes:update",
      "gate_passes:delete",
      "gate_passes:approve",
      "gate_passes:release",
      "gate_passes:read_all",
      "gate_pass_settings:read",
      "gate_pass_settings:update",
      "leave:read",
      "leave:create",
      "leave:update",
      "leave:approve",
      "leave:read_all",
      "mrf:read",
      "mrf:create",
      "mrf:update",
      "mrf:approve",
      "mrf:read_all",
      "purchase_requests:read",
      "purchase_requests:create",
      "purchase_requests:update",
      "purchase_requests:approve",
      "purchase_requests:read_all",
      "visitors:read",
      "visitors:create",
      "visitors:update",
      "visitors:check_in",
      "visitors:check_out",
      "visitors:read_all",
      "vehicles:read",
      "vehicles:create",
      "vehicles:update",
      "vehicles:delete",
      "vehicles:assign",
      "vehicles:manage",
      "vehicles:read_all",
      "assets:read",
      "assets:create",
      "assets:update",
      "assets:delete",
      "assets:borrow",
      "assets:approve",
      "assets:read_all",
      "reports:read_own",
      "reports:read_team",
      "reports:read_department",
      "reports:read_company",
      "reports:export",
      "system:read",
    ],
    it_support: [
      "dashboard:read",
      "users:read",
      "users:reset_password",
      "users:unlock_account",
      "audit_logs:read",
      "notifications:read",
      "notifications:update",
    ],
    executive: [
      "dashboard:read",
      "approval_requests:read",
      "approval_requests:approve",
      "reports:read_company",
      "reports:export",
      "notifications:read",
      "notifications:update",
      "gate_passes:read",
      "gate_passes:read_all",
      "leave:read_all",
      "mrf:read_all",
      "purchase_requests:read_all",
    ],
    department_manager: [
      "dashboard:read",
      "approval_requests:read",
      "approval_requests:approve",
      "reports:read_department",
      "reports:export",
      "notifications:read",
      "notifications:update",
      "employees:read",
      "gate_passes:read",
      "gate_passes:approve",
      "leave:read",
      "leave:approve",
      "mrf:read",
      "mrf:approve",
      "purchase_requests:read",
      "purchase_requests:approve",
      "assets:read",
      "assets:approve",
    ],
    department_supervisor: [
      "dashboard:read",
      "approval_requests:read",
      "approval_requests:approve",
      "reports:read_team",
      "notifications:read",
      "notifications:update",
      "employees:read",
      "gate_passes:read",
      "gate_passes:approve",
      "leave:read",
      "leave:approve",
      "mrf:read",
      "mrf:approve",
      "purchase_requests:read",
      "purchase_requests:approve",
      "assets:read",
      "assets:approve",
    ],
    approver: [
      "dashboard:read",
      "approval_requests:read",
      "approval_requests:approve",
      "notifications:read",
      "notifications:update",
    ],
    gad: [
      "dashboard:read",
      "gate_passes:read",
      "gate_passes:approve",
      "gate_pass_settings:read",
      "gate_pass_settings:update",
      "vehicles:read",
      "vehicles:assign",
      "vehicles:manage",
      "reports:read_department",
      "reports:export",
      "notifications:read",
      "notifications:update",
      "approval_requests:read",
      "approval_requests:approve",
    ],
    hr_officer: [
      "dashboard:read",
      "employees:read",
      "employees:create",
      "employees:update",
      "profiles:read",
      "profiles:create",
      "profiles:update",
      "leave:read",
      "leave:approve",
      "leave:read_all",
      "visitors:read",
      "visitors:create",
      "visitors:update",
      "reports:read_department",
      "reports:export",
      "notifications:read",
      "notifications:update",
      "gate_passes:read",
    ],
    security_guard: [
      "dashboard:read",
      "gate_passes:read",
      "gate_passes:release",
      "gate_passes:verify_qr",
      "visitors:check_in",
      "visitors:check_out",
      "vehicles:read",
      "notifications:read",
      "notifications:update",
    ],
    purchasing_officer: [
      "dashboard:read",
      "purchase_requests:read",
      "purchase_requests:read_all",
      "reports:read_department",
      "notifications:read",
      "notifications:update",
      "inventory:read",
    ],
    warehouse_officer: [
      "dashboard:read",
      "assets:read",
      "assets:create",
      "assets:update",
      "assets:read_all",
      "notifications:read",
      "notifications:update",
    ],
    vehicle_coordinator: [
      "dashboard:read",
      "vehicles:read",
      "vehicles:update",
      "vehicles:assign",
      "vehicles:manage",
      "vehicles:read_all",
      "notifications:read",
      "notifications:update",
      "reports:read_department",
    ],
    auditor: [
      "dashboard:read",
      "audit_logs:read",
      "audit_logs:export",
      "reports:read_company",
      "reports:export",
      "approval_requests:read",
    ],
    employee: [
      "dashboard:read",
      "gate_passes:read",
      "gate_passes:create",
      "gate_passes:update",
      "leave:read",
      "leave:create",
      "leave:update",
      "mrf:read",
      "mrf:create",
      "mrf:update",
      "purchase_requests:read",
      "purchase_requests:create",
      "purchase_requests:update",
      "visitors:read",
      "visitors:create",
      "vehicles:create",
      "assets:read",
      "assets:borrow",
      "reports:read_own",
      "notifications:read",
      "notifications:update",
      "profiles:read",
      "profiles:update",
    ],
  };

  // Assign permissions to roles
  const allDbPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allDbPermissions.map((p) => [`${p.module}:${p.action}`, p.id]));

  for (const [role, perms] of Object.entries(rolePermissions)) {
    for (const permKey of perms) {
      const permissionId = permissionMap.get(permKey);
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: { role_permission_id: { role: role as any, permission_id: permissionId } },
          update: {},
          create: { role: role as any, permission_id: permissionId },
        });
      }
    }
    console.log(`Assigned ${perms.length} permissions to ${role}`);
  }

  // ── Create default departments ───────────────────────────────
  const departments = [
    { code: "EXEC", name: "Executive", description: "Executive management" },
    { code: "ADMIN", name: "Administration", description: "Administrative department" },
    { code: "HR", name: "Human Resources", description: "HR department" },
    { code: "ENG", name: "Engineering", description: "Engineering department" },
    { code: "QA", name: "Quality Assurance", description: "QA department" },
    { code: "PROD", name: "Production", description: "Production department" },
    { code: "WH", name: "Warehouse", description: "Warehouse department" },
    { code: "PUR", name: "Purchasing", description: "Purchasing department" },
    { code: "SEC", name: "Security", description: "Security department" },
    {
      code: "GAD",
      name: "General Administration",
      description: "General administration department",
    },
    { code: "IT", name: "IT Department", description: "Information technology department" },
    { code: "FIN", name: "Finance", description: "Finance department" },
    { code: "VEH", name: "Vehicle Pool", description: "Vehicle coordination department" },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }

  console.log(`Created ${departments.length} departments`);

  // ── Create default control number settings ─────────────────
  const controlNumbers = [
    {
      module: "gate_pass",
      prefix: "GP",
      padding: 6,
      format_template: "GP-{YYYY}-{SEQ}",
      year: new Date().getFullYear(),
    },
    {
      module: "mrf",
      prefix: "MRF",
      padding: 6,
      format_template: "MRF-{YYYY}-{SEQ}",
      year: new Date().getFullYear(),
    },
    {
      module: "leave",
      prefix: "LV",
      padding: 6,
      format_template: "LV-{YYYY}-{SEQ}",
      year: new Date().getFullYear(),
    },
    {
      module: "visitor",
      prefix: "VIS",
      padding: 6,
      format_template: "VIS-{YYYY}-{SEQ}",
      year: new Date().getFullYear(),
    },
    {
      module: "vehicle",
      prefix: "VEH",
      padding: 6,
      format_template: "VEH-{YYYY}-{SEQ}",
      year: new Date().getFullYear(),
    },
    {
      module: "asset",
      prefix: "AST",
      padding: 6,
      format_template: "AST-{YYYY}-{SEQ}",
      year: new Date().getFullYear(),
    },
    {
      module: "purchase_request",
      prefix: "PR",
      padding: 6,
      format_template: "PR-{YYYY}-{SEQ}",
      year: new Date().getFullYear(),
    },
  ];

  for (const c of controlNumbers) {
    await prisma.controlNumberSetting.upsert({
      where: { module: c.module },
      update: {},
      create: c,
    });
  }

  console.log(`Created ${controlNumbers.length} control number settings`);

  // ── Create default admin user if not exists ────────────────
  const adminEmail = "admin@hst.com";
  const existingAdmin = await prisma.profile.findFirst({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.profile.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        employee_no: "ADMIN-001",
        first_name: "Super",
        last_name: "Admin",
        full_name: "Super Admin",
        employment_status: "active",
        is_active: true,
      },
    });

    // Assign super_administrator role
    await prisma.userRole.create({
      data: {
        user_id: admin.id,
        role: "super_administrator",
        assigned_by: admin.id,
      },
    });

    console.log("Created default admin user (admin@hst.com / admin123)");
  } else {
    console.log("Admin user already exists");
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
