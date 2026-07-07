/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check the admin user
  const adminEmail = 'admin@hst.com';
  const profile = await prisma.profile.findFirst({
    where: { email: adminEmail },
    include: { user_roles: true }
  });

  if (!profile) {
    console.log('Admin user not found. Please create an account first.');
    return;
  }

  console.log('Found user:', {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    roles: profile.user_roles.map(r => r.role)
  });

  // Check if user has administrator role
  const hasAdminRole = profile.user_roles.some(r => r.role === 'administrator');
  
  if (!hasAdminRole) {
    console.log('User does not have administrator role. Adding it...');
    await prisma.userRole.create({
      data: {
        user_id: profile.id,
        role: 'administrator'
      }
    });
    console.log('Administrator role added successfully!');
  } else {
    console.log('User already has administrator role.');
  }

  // Verify permissions
  const userRoles = await prisma.userRole.findMany({
    where: { user_id: profile.id },
    select: { role: true }
  });

  const roles = userRoles.map(r => r.role);
  const permissions = await prisma.rolePermission.findMany({
    where: {
      role: {
        in: roles,
      },
    },
    include: {
      permission: true,
    },
  });

  const uniquePermissions = [...new Set(permissions.map(p => `${p.permission.module}:${p.permission.action}`))];
  
  console.log('\nUser permissions:');
  console.log('Total permissions:', uniquePermissions.length);
  
  const gatePassPermissions = uniquePermissions.filter(p => p.startsWith('gate_passes:'));
  console.log('Gate pass permissions:', gatePassPermissions);
  
  if (gatePassPermissions.length === 0) {
    console.log('\nWARNING: No gate_passes permissions found!');
  } else {
    console.log('\n✓ User has gate_passes permissions');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });