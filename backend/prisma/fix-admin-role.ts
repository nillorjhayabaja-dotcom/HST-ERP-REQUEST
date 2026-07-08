/// <reference types="node" />

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fixing admin user role...\n");

  // Find the admin user
  const adminEmail = "admin@hst.com";
  const profile = await prisma.profile.findFirst({
    where: { email: adminEmail },
    include: { user_roles: true },
  });

  if (!profile) {
    console.log("Admin user not found.");
    return;
  }

  console.log("Found user:", {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    roles: profile.user_roles.map((r) => r.role),
  });

  // Check for invalid 'administrator' role
  const invalidRole = profile.user_roles.find((r) => r.role === "administrator");

  if (invalidRole) {
    console.log('\nFound invalid role "administrator". Removing it...');
    await prisma.userRole.delete({
      where: { id: invalidRole.id },
    });
    console.log('✓ Removed invalid "administrator" role');
  }

  // Check if user has super_administrator role
  const hasSuperAdmin = profile.user_roles.some((r: any) => r.role === "super_administrator");

  if (!hasSuperAdmin) {
    console.log('Adding "super_administrator" role...');
    await prisma.userRole.create({
      data: {
        user_id: profile.id,
        role: "super_administrator" as any,
        assigned_by: profile.id,
      },
    });
    console.log('✓ Added "super_administrator" role');
  } else {
    console.log('User already has "super_administrator" role.');
  }

  // Verify final state
  const updatedProfile = await prisma.profile.findFirst({
    where: { email: adminEmail },
    include: { user_roles: true },
  });

  console.log("\n✓ Final user roles:", updatedProfile?.user_roles.map((r) => r.role) || []);
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
