// Build fix script to handle Prisma issues during deployment
const fs = require('fs');
const path = require('path');

// Create a mock Prisma client for build time
const mockPrismaContent = `
// Mock Prisma Client for build time
export const prisma = {
  $connect: () => Promise.resolve(),
  $disconnect: () => Promise.resolve(),
  shipment: {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    findFirst: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  },
  trackingEvent: {
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
  },
  trip: {
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
  },
  checkIn: {
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
  },
  user: {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
  },
  $queryRaw: () => Promise.resolve([]),
  $executeRaw: () => Promise.resolve({}),
};

export default prisma;
`;

// Create lib/db-mock.ts
const mockPath = path.join(__dirname, 'lib', 'db-mock.ts');
fs.writeFileSync(mockPath, mockPrismaContent);

console.log('✅ Created mock Prisma client for build time');
