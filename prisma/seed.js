const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  // 1. Clean up existing users
  await prisma.user.deleteMany({});

  const hash = (p) => bcrypt.hashSync(p, SALT_ROUNDS);

  // 2. Create Admin User (hashed password)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@kapilla.com',
      password: hash('admin123'),
      name: 'Super Admin',
      role: 'ADMIN',
    },
  });

  // 3. Create Staff User
  const staff = await prisma.user.create({
    data: {
      email: 'staff@kapilla.com',
      password: hash('staff123'),
      name: 'John Staff',
      role: 'STAFF',
    },
  });

  console.log('Seeded admin and staff (passwords hashed)');
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
