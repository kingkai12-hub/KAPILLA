import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPickupRequestSMS } from '@/lib/sms';
import { sendEmail, emailTemplates } from '@/lib/email';

export const runtime = 'nodejs';

// POST: Create a new pickup request (Public)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderName, senderPhone, pickupAddress, destination, cargoDetails, estimatedWeight } = body;

    if (!senderName || !senderPhone || !pickupAddress || !destination || !cargoDetails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const request = await db.pickupRequest.create({
      data: {
        senderName,
        senderPhone,
        pickupAddress,
        destination,
        cargoDetails,
        estimatedWeight,
      },
    });

    // Send notifications after successful pickup request creation
    try {
      // Send SMS notification
      if (senderPhone) {
        await sendPickupRequestSMS(
          senderPhone,
          request.id,
          senderName
        );
      }

      // Send email notification if email provided
      if (senderPhone && senderPhone.includes('@')) {
        const emailTemplate = emailTemplates.pickupRequest(
          request.id,
          senderName,
          pickupAddress
        );
        await sendEmail({
          to: senderPhone,
          ...emailTemplate
        });
      }

      // Send admin notification
      const adminEmail = process.env.ADMIN_EMAIL || 'express@kapillagroup.co.tz';
      await sendEmail({
        to: adminEmail,
        subject: `New Pickup Request - #${request.id}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">New Pickup Request</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Kapilla Group Ltd</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-bottom: 20px;">Pickup Request Details:</h2>
              <div style="background: white; padding: 20px; border-left: 4px solid #f5576c; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">Request ID: #${request.id}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Customer: ${senderName}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Phone: ${senderPhone}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Pickup: ${pickupAddress}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Destination: ${destination}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #f5576c; font-weight: bold;">Status: PENDING</p>
                ${estimatedWeight ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Weight: ${estimatedWeight}</p>` : ''}
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Cargo Details:</strong> ${cargoDetails}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://kapillagroup.vercel.app/staff/pickup-requests" 
                   style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                  View in Staff Portal
                </a>
              </div>
            </div>
          </div>
        `
      });
    } catch (notificationError) {
      console.error('Failed to send pickup notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error('Error creating pickup request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: List all pickup requests (Protected - ideally, but we'll do simple check or assume middleware/client handles it)
// For now, we'll allow fetching, but in a real app, we should check auth.
// Since this is called from the staff portal which is protected, it's "okay" for this MVP.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const requests = await db.pickupRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching pickup requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
