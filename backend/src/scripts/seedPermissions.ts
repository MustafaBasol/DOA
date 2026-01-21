import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CLIENT';

const permissions = [
  // User permissions
  { resource: 'users', action: 'create', description: 'Create new users' },
  { resource: 'users', action: 'read', description: 'View user information' },
  { resource: 'users', action: 'update', description: 'Update user details' },
  { resource: 'users', action: 'delete', description: 'Delete users' },
  { resource: 'users', action: 'list', description: 'List all users' },
  
  // Message permissions
  { resource: 'messages', action: 'create', description: 'Send messages' },
  { resource: 'messages', action: 'read', description: 'View messages' },
  { resource: 'messages', action: 'update', description: 'Update message status' },
  { resource: 'messages', action: 'delete', description: 'Delete messages' },
  { resource: 'messages', action: 'list', description: 'List messages' },
  
  // Payment permissions
  { resource: 'payments', action: 'create', description: 'Create payment records' },
  { resource: 'payments', action: 'read', description: 'View payment information' },
  { resource: 'payments', action: 'update', description: 'Update payment details' },
  { resource: 'payments', action: 'delete', description: 'Delete payments' },
  { resource: 'payments', action: 'list', description: 'List all payments' },
  
  // Subscription permissions
  { resource: 'subscriptions', action: 'create', description: 'Create subscriptions' },
  { resource: 'subscriptions', action: 'read', description: 'View subscription information' },
  { resource: 'subscriptions', action: 'update', description: 'Update subscription details' },
  { resource: 'subscriptions', action: 'delete', description: 'Delete subscriptions' },
  { resource: 'subscriptions', action: 'list', description: 'List all subscriptions' },
  { resource: 'subscriptions', action: 'cancel', description: 'Cancel subscriptions' },
  
  // Analytics permissions
  { resource: 'analytics', action: 'read', description: 'View analytics data' },
  { resource: 'analytics', action: 'export', description: 'Export analytics reports' },
  
  // Report permissions
  { resource: 'reports', action: 'read', description: 'View reports' },
  { resource: 'reports', action: 'generate', description: 'Generate reports' },
  { resource: 'reports', action: 'export', description: 'Export reports' },
  
  // Search permissions
  { resource: 'search', action: 'read', description: 'Perform searches' },
  { resource: 'search', action: 'save', description: 'Save search queries' },
  { resource: 'search', action: 'delete', description: 'Delete saved searches' },
  
  // Settings permissions
  { resource: 'settings', action: 'read', description: 'View settings' },
  { resource: 'settings', action: 'update', description: 'Update settings' },
  
  // Audit log permissions
  { resource: 'audit', action: 'read', description: 'View audit logs' },
  
  // Role permissions
  { resource: 'roles', action: 'create', description: 'Create roles' },
  { resource: 'roles', action: 'read', description: 'View role information' },
  { resource: 'roles', action: 'update', description: 'Update roles' },
  { resource: 'roles', action: 'delete', description: 'Delete roles' },
  { resource: 'roles', action: 'assign', description: 'Assign roles to users' },
];

// Role-based permission assignments
const rolePermissions: Record<Role, string[]> = {
  SUPER_ADMIN: [
    // Full access to everything
    'users:create', 'users:read', 'users:update', 'users:delete', 'users:list',
    'messages:create', 'messages:read', 'messages:update', 'messages:delete', 'messages:list',
    'payments:create', 'payments:read', 'payments:update', 'payments:delete', 'payments:list',
    'subscriptions:create', 'subscriptions:read', 'subscriptions:update', 'subscriptions:delete', 'subscriptions:list', 'subscriptions:cancel',
    'analytics:read', 'analytics:export',
    'reports:read', 'reports:generate', 'reports:export',
    'search:read', 'search:save', 'search:delete',
    'settings:read', 'settings:update',
    'audit:read',
    'roles:create', 'roles:read', 'roles:update', 'roles:delete', 'roles:assign',
  ],
  
  ADMIN: [
    // Full access except role management
    'users:create', 'users:read', 'users:update', 'users:delete', 'users:list',
    'messages:create', 'messages:read', 'messages:update', 'messages:delete', 'messages:list',
    'payments:create', 'payments:read', 'payments:update', 'payments:delete', 'payments:list',
    'subscriptions:create', 'subscriptions:read', 'subscriptions:update', 'subscriptions:delete', 'subscriptions:list', 'subscriptions:cancel',
    'analytics:read', 'analytics:export',
    'reports:read', 'reports:generate', 'reports:export',
    'search:read', 'search:save', 'search:delete',
    'settings:read', 'settings:update',
    'audit:read',
  ],
  
  MANAGER: [
    // Can manage customers and view reports
    'users:read', 'users:update', 'users:list',
    'messages:read', 'messages:update', 'messages:list',
    'payments:read', 'payments:list',
    'subscriptions:read', 'subscriptions:update', 'subscriptions:list', 'subscriptions:cancel',
    'analytics:read',
    'reports:read', 'reports:generate',
    'search:read', 'search:save', 'search:delete',
    'settings:read',
  ],
  
  CLIENT: [
    // Can only view own data
    'messages:read', 'messages:list',
    'payments:read', 'payments:list',
    'subscriptions:read', 'subscriptions:list',
    'analytics:read',
    'reports:read',
    'search:read', 'search:save', 'search:delete',
    'settings:read',
  ],
};

async function seedPermissions() {
  console.log('🌱 Seeding permissions...');
  
  // Create permissions
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {
        description: perm.description,
      },
      create: perm,
    });
  }
  
  console.log(`✅ Created ${permissions.length} permissions`);
  
  // Assign permissions to roles
  console.log('🔑 Assigning permissions to roles...');
  
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(
    allPermissions.map((p: any) => [`${p.resource}:${p.action}`, p.id])
  );
  
  for (const [role, permKeys] of Object.entries(rolePermissions)) {
    for (const permKey of permKeys) {
      const permissionId = permissionMap.get(permKey);
      
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: role as Role,
              permissionId,
            },
          },
          update: {},
          create: {
            role: role as Role,
            permissionId,
          },
        });
      }
    }
  }
  
  console.log('✅ Assigned permissions to all roles');
  
  // Print summary
  console.log('\n📊 Permission Summary:');
  const summary = await prisma.rolePermission.groupBy({
    by: ['role'],
    _count: true,
  });
  
  summary.forEach(({ role, _count }: any) => {
    console.log(`  ${role}: ${_count} permissions`);
  });
}

async function main() {
  try {
    await seedPermissions();
    console.log('\n✨ Permissions seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
