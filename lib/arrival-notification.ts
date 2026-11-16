/**
 * Arrival alerts for the tracking simulation.
 *
 * When a vehicle reaches its destination the shipment is deliberately NOT
 * auto-delivered — a human has to confirm the hand-over. This helper raises
 * that "needs action" alert: an in-app notification for every user in the
 * portal, an FCM push to their devices, plus an email and SMS to the office.
 *
 * It is idempotent: one alert per waybill, no matter how often the tracking
 * endpoint is polled.
 */

import { sendEmail } from '@/lib/email';
import { sendShipmentUpdateSMS } from '@/lib/sms';
import { notifyStaff, ALL_PORTAL_ROLES } from '@/lib/notify';
import { SITE_URL } from '@/lib/utils';

/**
 * The arrival message goes to every user in the portal — not just the
 * operations desk — so whoever is at hand can confirm the hand-over.
 */
const NOTIFY_ROLES = ALL_PORTAL_ROLES;

const OFFICE_EMAIL = process.env.OFFICE_EMAIL || 'info@kapillagroup.co.tz';
const OFFICE_PHONE = process.env.OFFICE_PHONE || '+255712345678';

export const ARRIVAL_NOTIFICATION_TYPE = 'SHIPMENT_ARRIVED';

export interface ArrivalShipment {
  waybillNumber: string;
  origin: string;
  destination: string;
  senderName?: string | null;
  receiverName?: string | null;
}

/**
 * Tell the operations team that a waybill has arrived and needs action.
 * Safe to call on every request — duplicates are suppressed.
 */
export async function notifyArrival(shipment: ArrivalShipment): Promise<void> {
  const title = `Waybill ${shipment.waybillNumber} arrived — needs action`;
  const message = `Cargo from ${shipment.origin} has arrived at ${shipment.destination}. Confirm delivery and hand it over to the recipient.`;
  const link = `/staff/shipments/${encodeURIComponent(shipment.waybillNumber)}/confirm`;

  // 1) In-app alerts + a device push, deduped on the waybill so polling the
  // tracking endpoint cannot raise the same alert twice.
  await notifyStaff({
    title,
    message,
    link,
    type: ARRIVAL_NOTIFICATION_TYPE,
    roles: NOTIFY_ROLES,
    dedupe: true,
  });

  // 2) Office email.
  try {
    await sendEmail({
      to: OFFICE_EMAIL,
      subject: `Cargo Arrived — Waybill ${shipment.waybillNumber} needs action`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
            <h1 style="color:white;margin:0;font-size:26px;">Cargo Arrived — Action Needed</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0 0;">Kapilla Group Ltd</p>
          </div>
          <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
            <div style="background:white;padding:20px;border-left:4px solid #d97706;margin:20px 0;border-radius:5px;">
              <p style="margin:0;font-size:18px;font-weight:bold;color:#333;">Waybill: ${shipment.waybillNumber}</p>
              <p style="margin:8px 0 0 0;color:#555;">From: <strong>${shipment.origin}</strong></p>
              <p style="margin:4px 0 0 0;color:#555;">To: <strong>${shipment.destination}</strong></p>
            </div>
            <p style="color:#666;">The vehicle has reached ${shipment.destination}. Please confirm the delivery in the staff portal.</p>
            <div style="text-align:center;margin-top:24px;">
              <a href="${SITE_URL}/staff/shipments/${encodeURIComponent(shipment.waybillNumber)}/confirm" style="background:#d97706;color:white;padding:12px 30px;text-decoration:none;border-radius:25px;display:inline-block;font-weight:bold;">
                Confirm Delivery
              </a>
            </div>
          </div>
        </div>`,
    });
  } catch (e) {
    console.error('[ARRIVAL] Office email failed:', e);
  }

  // 3) Office SMS.
  try {
    await sendShipmentUpdateSMS(
      OFFICE_PHONE,
      shipment.waybillNumber,
      `ARRIVED at ${shipment.destination} - confirm delivery needed`,
      'Operations'
    );
  } catch (e) {
    console.error('[ARRIVAL] Office SMS failed:', e);
  }
}
