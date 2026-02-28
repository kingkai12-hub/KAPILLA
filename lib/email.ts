import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

// Create transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const mailOptions = {
      from: options.from || `"Kapilla Group Ltd" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Email templates
export const emailTemplates = {
  shipmentUpdate: (waybill: string, status: string, customerName: string) => ({
    subject: `Shipment Update - ${waybill}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Kapilla Group Ltd</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Shipment Update Notification</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${customerName},</h2>
          <p style="color: #666; line-height: 1.6;">Your shipment has been updated with the following status:</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">Waybill: ${waybill}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: #667eea; font-weight: bold;">Status: ${status}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-top: 20px;">You can track your shipment using the waybill number above on our website or contact our support team for any assistance.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://kapillagroup.vercel.app/tracking?waybill=${waybill}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              Track Shipment
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
            <p>&copy; 2024 Kapilla Group Ltd. All rights reserved.</p>
            <p>express@kapillagroup.co.tz | +255 712 345 678</p>
          </div>
        </div>
      </div>
    `,
  }),

  pickupRequest: (requestId: string, customerName: string, pickupAddress: string) => ({
    subject: `Pickup Request Received - #${requestId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Kapilla Group Ltd</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Pickup Request Confirmation</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${customerName},</h2>
          <p style="color: #666; line-height: 1.6;">We have received your pickup request and our team will contact you shortly to confirm the details.</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #f5576c; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">Request ID: #${requestId}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Pickup Address: ${pickupAddress}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Status: <span style="color: #f5576c; font-weight: bold;">Pending Confirmation</span></p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-top: 20px;">Our customer service team will contact you within 24 hours to schedule the pickup.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://kapillagroup.vercel.app" 
               style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              Visit Website
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
            <p>&copy; 2024 Kapilla Group Ltd. All rights reserved.</p>
            <p>express@kapillagroup.co.tz | +255 712 345 678</p>
          </div>
        </div>
      </div>
    `,
  }),

  welcomeEmail: (userName: string, tempPassword: string) => ({
    subject: 'Welcome to Kapilla Group Staff Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Kapilla Group</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Staff Portal Access</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName},</h2>
          <p style="color: #666; line-height: 1.6;">Your staff account has been created. You can now access the Kapilla Group Staff Portal.</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">Login Details:</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Email: Your registered email</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Temporary Password: <span style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px; font-family: monospace;">${tempPassword}</span></p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-top: 20px;">Please login and change your password immediately for security reasons.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://kapillagroup.vercel.app/staff/login" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              Login to Staff Portal
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
            <p>&copy; 2024 Kapilla Group Ltd. All rights reserved.</p>
            <p>express@kapillagroup.co.tz | +255 712 345 678</p>
          </div>
        </div>
      </div>
    `,
  }),
};

export default transporter;
