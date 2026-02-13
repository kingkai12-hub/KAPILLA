import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendShipmentUpdateSMS, sendDeliveryConfirmationSMS } from '@/lib/sms';
import { sendEmail, emailTemplates } from '@/lib/email';
import { requireAuth, requireRole } from '@/lib/auth';

const STAFF_ROLES = ['ADMIN', 'STAFF', 'DRIVER', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'];

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!requireRole(auth.user!, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { waybillNumber, status, location, remarks, signature, receivedBy, estimatedDelivery, estimatedDeliveryTime, transportType } = body;

    if (!waybillNumber || !status || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find shipment first to get ID
    const shipment = await db.shipment.findUnique({
      where: { waybillNumber }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Transaction operations
    const composedRemarks = (() => {
      const parts = [remarks?.trim()].filter(Boolean);
      if (estimatedDelivery) {
        let eta = `ETA: ${estimatedDelivery}`;
        if (estimatedDeliveryTime) eta += ` ${estimatedDeliveryTime}`;
        parts.push(eta);
      }
      if (transportType) parts.push(`Mode: ${transportType}`);
      return parts.join(' | ');
    })();

    const operations: any[] = [
      db.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status,
          location,
          remarks: composedRemarks
        }
      })
    ];

    if (shipment.currentStatus === 'PENDING') {
        operations.push(
            db.shipment.update({
                where: { id: shipment.id },
                data: { currentStatus: 'IN_TRANSIT' }
            })
        );
    }

    const result = await db.$transaction(operations);

    // Send notifications after successful tracking update
    try {
      const updatedStatus = shipment.currentStatus === 'PENDING' ? 'IN_TRANSIT' : status;
      
      // Send SMS notification to receiver
      if (shipment.receiverPhone) {
        if (updatedStatus === 'DELIVERED') {
          await sendDeliveryConfirmationSMS(
            shipment.receiverPhone,
            shipment.waybillNumber,
            shipment.receiverName,
            remarks || 'Delivery Team'
          );
        } else {
          await sendShipmentUpdateSMS(
            shipment.receiverPhone,
            shipment.waybillNumber,
            updatedStatus,
            shipment.receiverName
          );
        }
      }

      // Send email notification to receiver
      if (shipment.receiverPhone && shipment.receiverPhone.includes('@')) {
        const emailTemplate = emailTemplates.shipmentUpdate(
          shipment.waybillNumber,
          updatedStatus,
          shipment.receiverName
        );
        await sendEmail({
          to: shipment.receiverPhone,
          ...emailTemplate
        });
      }

      // Send admin notification for delivery
      if (updatedStatus === 'DELIVERED') {
        const adminEmail = process.env.ADMIN_EMAIL || 'express@kapillagroup.co.tz';
        await sendEmail({
          to: adminEmail,
          subject: `Shipment Delivered - ${shipment.waybillNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">✓ Shipment Delivered</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Kapilla Group Ltd</p>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Delivery Confirmation:</h2>
                <div style="background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px;">
                  <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">Waybill: ${shipment.waybillNumber}</p>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Receiver: ${shipment.receiverName}</p>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Location: ${location}</p>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #10b981; font-weight: bold;">Status: DELIVERED ✓</p>
                  ${receivedBy ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Received By: ${receivedBy}</p>` : ''}
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://kapillagroup.vercel.app/staff/shipments" 
                     style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                    View in Staff Portal
                  </a>
                </div>
              </div>
            </div>
          `
        });
      }
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(result[0]); // Return the created event
  } catch (error) {
    console.error('[TRACKING_POST_ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
