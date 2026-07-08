/// <reference types="node" />

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking AppRole enum values in database...\n");

  // Check current enum values
  const enumValues = await prisma.$queryRaw<any[]>`
    SELECT enumlabel FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AppRole')
    ORDER BY enumsortorder
  `;

  console.log("Current AppRole enum values in database:");
  enumValues.forEach((row: any) => console.log("  -", row.enumlabel));

  // Check what roles are currently assigned
  const roles = await prisma.$queryRaw<any[]>`
    SELECT DISTINCT role, COUNT(*) as count 
    FROM user_roles 
    GROUP BY role 
    ORDER BY role
  `;

  console.log("\nCurrent roles in user_roles table:");
  roles.forEach((row: any) => console.log(`  - ${row.role}: ${row.count} users`));
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
