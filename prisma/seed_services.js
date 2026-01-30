const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = [
    {
      title: "Land Transportation",
      description: "Modern fleet for reliable ground delivery",
      imageUrl: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&q=80&w=800",
      icon: "Truck",
      sortOrder: 1
    },
    {
      title: "Ocean Freight",
      description: "Efficient global maritime shipping",
      imageUrl: "https://images.unsplash.com/photo-1494412651409-ae1c40237cdd?auto=format&fit=crop&q=80&w=800",
      icon: "Ship",
      sortOrder: 2
    },
    {
      title: "Air Cargo",
      description: "Express international delivery",
      imageUrl: "https://images.unsplash.com/photo-1519882189396-71f93cb4714b?auto=format&fit=crop&q=80&w=800",
      icon: "Plane",
      sortOrder: 3
    },
    {
      title: "Warehousing",
      description: "Secure storage and distribution",
      imageUrl: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&q=80&w=800",
      icon: "Package",
      sortOrder: 4
    }
  ];

  console.log('Seeding services...');
  for (const service of services) {
    // We try to find by title to avoid duplicates, although title isn't unique in schema, it serves as a logical key here
    const existing = await prisma.serviceShowcase.findFirst({
      where: { title: service.title }
    });

    if (!existing) {
      await prisma.serviceShowcase.create({
        data: service
      });
      console.log(`Created service: ${service.title}`);
    } else {
      console.log(`Service already exists: ${service.title}`);
    }
  }
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
