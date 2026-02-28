const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestShipment() {
  try {
    // First check if we have users
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('No users found. Please run seed.js first.');
      return;
    }

    // Check if test shipment already exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { waybillNumber: 'KPL-8829' }
    });

    if (existingShipment) {
      console.log('Test shipment KPL-8829 already exists');
      return existingShipment;
    }

    // Create a test shipment
    const shipment = await prisma.shipment.create({
      data: {
        waybillNumber: 'KPL-8829',
        senderName: 'John Doe',
        senderEmail: 'john@example.com',
        senderPhone: '+255123456789',
        senderAddress: 'Dar es Salaam, Tanzania',
        receiverName: 'Jane Smith',
        receiverPhone: '+255987654321',
        receiverAddress: 'Arusha, Tanzania',
        origin: 'Dar es Salaam',
        destination: 'Arusha',
        weight: 5.5,
        price: 25000,
        cargoDetails: 'Electronics - Laptops',
        currentStatus: 'IN_TRANSIT',
        dispatcherName: 'Admin User',
        events: {
          create: [
            {
              status: 'PENDING',
              location: 'Dar es Salaam',
              remarks: 'Shipment received and processed'
            },
            {
              status: 'IN_TRANSIT',
              location: 'Morogoro',
              remarks: 'Shipment in transit to destination. ETA: 2026-02-15 14:00 Mode: LAND'
            }
          ]
        },
        trips: {
          create: {
            driverId: users[0].id, // Use first available user as driver
            startLocation: 'Dar es Salaam',
            endLocation: 'Arusha',
            checkIns: {
              create: [
                {
                  location: 'Morogoro',
                  latitude: -6.8278,
                  longitude: 37.6591,
                  status: 'OK',
                  timestamp: new Date()
                }
              ]
            }
          }
        }
      },
      include: {
        events: true,
        trips: {
          include: {
            checkIns: true
          }
        }
      }
    });

    console.log('Test shipment created successfully:', shipment.waybillNumber);
    return shipment;
  } catch (error) {
    console.error('Error creating test shipment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestShipment();
