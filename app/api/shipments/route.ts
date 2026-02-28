import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendShipmentCreatedSMS, sendShipmentCreatedToReceiverSMS } from '@/lib/sms';
import { sendEmail, emailTemplates } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireRole } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STAFF_ROLES = ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'];

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const shipments = await db.shipment.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(shipments);
  } catch (error) {
    console.error('[SHIPMENTS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const {
      senderName,
      senderEmail,
      senderPhone,
      senderAddress,
      receiverName,
      receiverPhone,
      receiverAddress,
      origin,
      destination,
      weight,
      price,
      cargoDetails,
      dispatcherName,
      dispatcherSignature,
    } = body;

    async function nextWaybill() {
      // Simple 4-digit waybill number
      // Get all shipments and find the highest 4-digit number
      const allShipments = await db.shipment.findMany({
        select: { waybillNumber: true },
        orderBy: { createdAt: 'desc' },
        take: 100, // Get last 100 to find highest 4-digit number
      });

      let maxNumber = 0;
      for (const shipment of allShipments) {
        const num = parseInt(shipment.waybillNumber, 10);
        if (!isNaN(num) && shipment.waybillNumber.length === 4) {
          maxNumber = Math.max(maxNumber, num);
        }
      }

      return String(maxNumber + 1).padStart(4, '0');
    }

    let waybillNumber = await nextWaybill();
    let shipment = null;
    for (let i = 0; i < 3; i++) {
      try {
        shipment = await db.shipment.create({
          data: {
            waybillNumber,
            senderName,
            senderEmail: senderEmail || null,
            senderPhone,
            senderAddress,
            receiverName,
            receiverPhone,
            receiverAddress,
            origin,
            destination,
            weight: weight ? parseFloat(weight) : null,
            price: price ? parseFloat(price) : null,
            cargoDetails,
            currentStatus: 'PENDING',
            dispatcherName,
            dispatcherSignature,
            events: {
              create: {
                status: 'PENDING',
                location: origin,
                remarks: 'Shipment created',
              },
            },
          },
        });
        break;
      } catch (e) {
        const error = e as { code?: string };
        if (error?.code === 'P2002') {
          // Unique constraint violation, increment and retry
          const v = parseInt(waybillNumber, 10);
          const next = Number.isNaN(v) ? 1 : v + 1;
          waybillNumber = String(next).padStart(4, '0');
          continue;
        }
        throw e;
      }
    }

    if (!shipment) {
      return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
    }

    // Send SMS notification if sender phone is provided
    if (senderPhone) {
      await sendShipmentCreatedSMS(senderPhone, waybillNumber, senderName, destination);
    }

    // Also send SMS to receiver with waybill number
    if (receiverPhone) {
      await sendShipmentCreatedToReceiverSMS(
        receiverPhone,
        waybillNumber,
        receiverName,
        senderName,
        destination
      );
    }

    // Send email notification if sender email is provided
    if (senderEmail && senderEmail.includes('@')) {
      const emailTemplate = emailTemplates.shipmentUpdate(waybillNumber, 'PENDING', senderName);
      await sendEmail({
        to: senderEmail,
        ...emailTemplate,
      });
    }

    // Also send email to admin for notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'express@kapillagroup.co.tz';
      await sendEmail({
        to: adminEmail,
        subject: `New Shipment Created - ${waybillNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">New Shipment Alert</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Kapilla Group Ltd</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-bottom: 20px;">Shipment Details:</h2>
              <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">Waybill: ${waybillNumber}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Sender: ${senderName}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Receiver: ${receiverName}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Route: ${origin} → ${destination}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #667eea; font-weight: bold;">Status: PENDING</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://kapillagroup.vercel.app/staff/shipments" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                  View in Staff Portal
                </a>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send admin email:', emailError);
    }

    revalidatePath('/staff/dashboard');
    revalidatePath('/staff/shipments');

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error('[SHIPMENTS_POST] Error:', error);
    // Return the actual error message for debugging (in development)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}
