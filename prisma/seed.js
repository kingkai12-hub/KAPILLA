const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // 1. Clean up existing users
  await prisma.user.deleteMany({});

  // 2. Create Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@kapilla.com',
      password: 'admin123', // In a real app, hash this!
      name: 'Super Admin',
      role: 'ADMIN',
    },
  });

  // 3. Create Staff User
  const staff = await prisma.user.create({
    data: {
      email: 'staff@kapilla.com',
      password: 'staff123',
      name: 'John Staff',
      role: 'STAFF',
    },
  });

  console.log({ admin, staff });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
