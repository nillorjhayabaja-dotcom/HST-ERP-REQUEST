/// <reference types="node" />

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Migrating AppRole enum values...\n");

  // First, let's add all the new enum values that don't exist yet
  const newEnumValues = [
    "super_administrator",
    "system_administrator",
    "department_manager",
    "department_supervisor",
    "approver",
    "hr_officer",
    "gad",
    "security_guard",
    "purchasing_officer",
    "warehouse_officer",
    "vehicle_coordinator",
    "it_support",
    "auditor",
  ];

  console.log("Adding new enum values to database...");
  for (const value of newEnumValues) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "AppRole" ADD VALUE IF NOT EXISTS '${value}'`);
      console.log(`  ✓ Added ${value}`);
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        console.log(`  - ${value} already exists`);
      } else {
        console.error(`  ✗ Error adding ${value}:`, error.message);
      }
    }
  }

  // Now update existing roles to match new schema
  console.log("\nUpdating existing roles...");

  const roleMappings: Record<string, string> = {
    administrator: "super_administrator",
    hr: "hr_officer",
    security: "security_guard",
    it_administrator: "it_support",
    department_head: "department_manager",
  };

  for (const [oldRole, newRole] of Object.entries(roleMappings)) {
    try {
      const result = await prisma.$executeRawUnsafe(
        `UPDATE user_roles SET role = '${newRole}'::"AppRole" WHERE role = '${oldRole}'::"AppRole"`,
      );
      console.log(`  ✓ Updated ${oldRole} → ${newRole}`);
    } catch (error: any) {
      console.error(`  ✗ Error updating ${oldRole}:`, error.message);
    }
  }

  // Verify the changes
  console.log("\nVerifying changes...");
  const enumValues = await prisma.$queryRaw<any[]>`
    SELECT enumlabel FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AppRole')
    ORDER BY enumsortorder
  `;

  console.log("Current AppRole enum values in database:");
  enumValues.forEach((row: any) => console.log("  -", row.enumlabel));

  const roles = await prisma.$queryRaw<any[]>`
    SELECT DISTINCT role, COUNT(*) as count 
    FROM user_roles 
    GROUP BY role 
    ORDER BY role
  `;

  console.log("\nCurrent roles in user_roles table:");
  roles.forEach((row: any) => console.log(`  - ${row.role}: ${row.count} users`));

  console.log("\n✓ Migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
