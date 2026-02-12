import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Create test shipments for demonstration
export async function POST(req: Request) {
  try {
    const testShipments = [
      {
        waybillNumber: 'KPL-26020002',
        senderName: 'Test Sender 1',
        senderPhone: '+255123456789',
        receiverName: 'Test Receiver 1',
        receiverPhone: '+255987654321',
        origin: 'Dar es Salaam',
        destination: 'Mbeya',
        weight: 150.5,
        price: 250000,
        cargoDetails: 'Electronics and household items',
        currentStatus: 'IN_TRANSIT'
      },
      {
        waybillNumber: 'KPL-26020003',
        senderName: 'Test Sender 2',
        senderPhone: '+255123456780',
        receiverName: 'Test Receiver 2',
        receiverPhone: '+255987654320',
        origin: 'Dar es Salaam',
        destination: 'Mwanza',
        weight: 200.0,
        price: 300000,
        cargoDetails: 'Industrial equipment',
        currentStatus: 'IN_TRANSIT'
      },
      {
        waybillNumber: 'KPL-26020004',
        senderName: 'Test Sender 3',
        senderPhone: '+255123456781',
        receiverName: 'Test Receiver 3',
        receiverPhone: '+255987654321',
        origin: 'Dar es Salaam',
        destination: 'Arusha',
        weight: 75.5,
        price: 150000,
        cargoDetails: 'Tourist supplies',
        currentStatus: 'IN_TRANSIT'
      }
    ];

    const results = [];

    for (const shipmentData of testShipments) {
      // Check if shipment already exists
      const existing = await db.shipment.findUnique({
        where: { waybillNumber: shipmentData.waybillNumber }
      });

      if (!existing) {
        const shipment = await db.shipment.create({
          data: {
            ...shipmentData,
            senderEmail: `sender${shipmentData.waybillNumber.slice(-1)}@test.com`,
            receiverAddress: `Test Address for ${shipmentData.destination}`,
            senderAddress: `Test Address for ${shipmentData.origin}`,
          }
        });

        // Create initial tracking event
        await db.trackingEvent.create({
          data: {
            shipmentId: shipment.id,
            status: 'DISPATCHED',
            location: shipmentData.origin,
            remarks: 'Shipment dispatched from origin'
          }
        });

        results.push({
          waybillNumber: shipment.waybillNumber,
          status: 'created',
          id: shipment.id
        });
      } else {
        results.push({
          waybillNumber: existing.waybillNumber,
          status: 'exists',
          id: existing.id
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test shipments processed',
      results
    });

  } catch (error) {
    console.error('[TEST_TRACKING_ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// GET: Check test shipments status
export async function GET(req: Request) {
  try {
    const testWaybills = ['KPL-26020002', 'KPL-26020003', 'KPL-26020004'];
    
    const shipments = await db.shipment.findMany({
      where: {
        waybillNumber: { in: testWaybills }
      },
      include: {
        vehicleTracking: true,
        events: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      shipments: shipments.map((s: any) => ({
        waybillNumber: s.waybillNumber,
        status: s.currentStatus,
        origin: s.origin,
        destination: s.destination,
        hasTracking: !!s.vehicleTracking,
        progress: s.vehicleTracking?.progressPercent || 0,
        lastEvent: s.events[0]?.status || 'None'
      }))
    });

  } catch (error) {
    console.error('[TEST_TRACKING_GET_ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
