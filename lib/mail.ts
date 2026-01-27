import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendShipmentCreatedEmail(
  email: string,
  waybillNumber: string,
  senderName: string,
  receiverName: string,
  destination: string
) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not found. Email not sent.');
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Kapilla Logistics" <no-reply@kapillalogistics.com>',
    to: email,
    subject: `Shipment Created - Waybill: ${waybillNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0;">Kapilla Logistics</h1>
          <p style="color: #64748b; font-size: 14px;">Global Logistics Partner</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin-top: 0;">Shipment Created Successfully</h2>
          <p style="color: #334155;">Dear <strong>${senderName}</strong>,</p>
          <p style="color: #334155;">Thank you for choosing Kapilla Logistics. Your shipment to <strong>${receiverName}</strong> in <strong>${destination}</strong> has been registered.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #64748b; margin-bottom: 5px;">Your Waybill Number is:</p>
          <div style="background-color: #2563eb; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 8px; display: inline-block; letter-spacing: 2px;">
            ${waybillNumber}
          </div>
        </div>

        <div style="color: #334155; margin-bottom: 20px;">
          <p>You can track your shipment at any time using this Waybill Number on our website.</p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          <p>This is an automated message. Please do not reply directly to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Kapilla Logistics. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email} for waybill ${waybillNumber}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
