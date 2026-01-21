import { PrismaClient, Role, Language } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // İlk admin kullanıcı oluştur
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@autoviseo.com' },
    update: {},
    create: {
      email: 'admin@autoviseo.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      fullName: 'System Administrator',
      companyName: 'Autoviseo',
      language: Language.TR,
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Örnek test müşterisi (development için)
  if (process.env.NODE_ENV === 'development') {
    const clientPasswordHash = await bcrypt.hash('Client123!', 12);
    
    const client = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        passwordHash: clientPasswordHash,
        role: Role.CLIENT,
        fullName: 'Test Client',
        companyName: 'Test Company',
        phone: '+905551234567',
        whatsappNumber: '+905551234567',
        language: Language.TR,
        isActive: true,
        createdByUserId: admin.id,
      },
    });

    console.log('✅ Test client created:', client.email);

    // Örnek abonelik
    const subscription = await prisma.subscription.create({
      data: {
        userId: client.id,
        planName: 'Premium',
        monthlyPrice: 750,
        startDate: new Date(),
        status: 'ACTIVE',
      },
    });

    console.log('✅ Test subscription created');

    // Örnek ödeme
    await prisma.payment.create({
      data: {
        userId: client.id,
        subscriptionId: subscription.id,
        amount: 750,
        currency: 'TRY',
        paymentDate: new Date(),
        paymentMethod: 'credit_card',
        status: 'COMPLETED',
      },
    });

    console.log('✅ Test payment created');
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
