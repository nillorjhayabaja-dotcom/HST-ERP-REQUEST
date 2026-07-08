/// <reference types="node" />

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fixing admin user role using raw SQL...\n");

  // Find the admin user using raw SQL to avoid enum validation
  const adminEmail = "admin@hst.com";
  const profile = await prisma.$queryRaw<any[]>`
    SELECT * FROM profiles WHERE email = ${adminEmail} LIMIT 1
  `;

  if (!profile || profile.length === 0) {
    console.log("Admin user not found.");
    return;
  }

  const adminProfile = profile[0];
  console.log("Found user:", {
    id: adminProfile.id,
    email: adminProfile.email,
    full_name: adminProfile.full_name,
  });

  // Get user roles using raw SQL
  const userRoles = await prisma.$queryRaw<any[]>`
    SELECT * FROM user_roles WHERE user_id = ${adminProfile.id}
  `;

  console.log(
    "Current roles:",
    userRoles.map((r: any) => r.role),
  );

  // Check for invalid 'administrator' role
  const invalidRole = userRoles.find((r: any) => r.role === "administrator");

  if (invalidRole) {
    console.log('\nFound invalid role "administrator". Removing it...');
    await prisma.$executeRaw`
      DELETE FROM user_roles WHERE id = ${invalidRole.id}
    `;
    console.log('✓ Removed invalid "administrator" role');
  }

  // Check if user has super_administrator role
  const hasSuperAdmin = userRoles.some((r: any) => r.role === "super_administrator");

  if (!hasSuperAdmin) {
    console.log('Adding "super_administrator" role...');
    await prisma.$executeRaw`
      INSERT INTO user_roles (user_id, role, assigned_at, assigned_by)
      VALUES (${adminProfile.id}, 'super_administrator', CURRENT_TIMESTAMP, ${adminProfile.id})
    `;
    console.log('✓ Added "super_administrator" role');
  } else {
    console.log('User already has "super_administrator" role.');
  }

  // Verify final state
  const updatedRoles = await prisma.$queryRaw<any[]>`
    SELECT * FROM user_roles WHERE user_id = ${adminProfile.id}
  `;

  console.log(
    "\n✓ Final user roles:",
    updatedRoles.map((r: any) => r.role),
  );
  console.log("\nFix completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
