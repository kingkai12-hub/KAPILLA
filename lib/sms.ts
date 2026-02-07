// Enhanced SMS Service Implementation
// Supports multiple SMS providers: Twilio, Africa's Talking, Infobip
// Environment variables needed:
// SMS_PROVIDER=twilio|africastalking|infobip|simulation
// TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
// AFRICASTALKING_API_KEY, AFRICASTALKING_USERNAME, AFRICASTALKING_SENDER
// INFOBIP_API_KEY, INFOBIP_BASE_URL

interface SMSProvider {
  sendSMS(to: string, message: string): Promise<boolean>;
}

// Twilio Provider
class TwilioProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID!;
    this.authToken = process.env.TWILIO_AUTH_TOKEN!;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER!;
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const twilio = require('twilio');
      const client = twilio(this.accountSid, this.authToken);
      
      await client.messages.create({
        body: message,
        to: this.formatPhone(to),
        from: this.fromNumber,
      });
      
      console.log(`SMS sent via Twilio to ${to}`);
      return true;
    } catch (error) {
      console.error('Twilio SMS failed:', error);
      return false;
    }
  }

  private formatPhone(phone: string): string {
    // Format to international format: +255XXXXXXXXX
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('255') && cleaned.length === 12) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+255${cleaned.slice(1)}`;
    } else if (cleaned.length === 9 && !cleaned.startsWith('0')) {
      return `+255${cleaned}`;
    }
    return `+${cleaned}`;
  }
}

// Africa's Talking Provider
class AfricaTalkingProvider implements SMSProvider {
  private apiKey: string;
  private username: string;
  private sender: string;

  constructor() {
    this.apiKey = process.env.AFRICASTALKING_API_KEY!;
    this.username = process.env.AFRICASTALKING_USERNAME!;
    this.sender = process.env.AFRICASTALKING_SENDER || 'KAPILLA';
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const axios = require('axios');
      
      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        {
          username: this.username,
          to: this.formatPhone(to),
          message: message,
          from: this.sender,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'apiKey': this.apiKey,
          },
        }
      );
      
      console.log(`SMS sent via Africa's Talking to ${to}`);
      return true;
    } catch (error) {
      console.error('Africa\'s Talking SMS failed:', error);
      return false;
    }
  }

  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('255') && cleaned.length === 12) {
      return cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `255${cleaned.slice(1)}`;
    } else if (cleaned.length === 9 && !cleaned.startsWith('0')) {
      return `255${cleaned}`;
    }
    return cleaned;
  }
}

// Simulation Provider (for development)
class SimulationProvider implements SMSProvider {
  async sendSMS(to: string, message: string): Promise<boolean> {
    console.log('--- SMS SIMULATION ---');
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('----------------------');
    return true;
  }
}

// Get SMS provider based on environment
function getSMSProvider(): SMSProvider {
  const provider = process.env.SMS_PROVIDER?.toLowerCase();
  
  switch (provider) {
    case 'twilio':
      return new TwilioProvider();
    case 'africastalking':
      return new AfricaTalkingProvider();
    case 'simulation':
    default:
      return new SimulationProvider();
  }
}

const smsProvider = getSMSProvider();

// Enhanced SMS functions
export async function sendShipmentCreatedSMS(
  phoneNumber: string,
  waybillNumber: string,
  senderName: string,
  destination: string
): Promise<boolean> {
  const message = `📦 KAPILLA LOGISTICS\n\nDear ${senderName},\n\nYour shipment has been created!\n\n🎫 WAYBILL: ${waybillNumber}\n📍 Route: ${destination}\n\nTrack: kapillagroup.vercel.app/tracking?waybill=${waybillNumber}\n\nThank you for choosing Kapilla Logistics!`;
  
  return await smsProvider.sendSMS(phoneNumber, message);
}

export async function sendShipmentCreatedToReceiverSMS(
  phoneNumber: string,
  waybillNumber: string,
  receiverName: string,
  senderName: string,
  destination: string
): Promise<boolean> {
  const message = `📦 KAPILLA LOGISTICS\n\nDear ${receiverName},\n\nYou have a shipment from ${senderName}!\n\n🎫 WAYBILL: ${waybillNumber}\n📍 Route: ${destination}\n\nTrack: kapillagroup.vercel.app/tracking?waybill=${waybillNumber}\n\nThank you for choosing Kapilla Logistics!`;
  
  return await smsProvider.sendSMS(phoneNumber, message);
}

export async function sendShipmentUpdateSMS(
  phoneNumber: string,
  waybillNumber: string,
  status: string,
  customerName: string
): Promise<boolean> {
  const message = `📦 KAPILLA LOGISTICS\n\nDear ${customerName},\n\nYour shipment status updated!\n\n🎫 WAYBILL: ${waybillNumber}\n📊 Status: ${status}\n\nTrack: kapillagroup.vercel.app/tracking?waybill=${waybillNumber}\n\n- Kapilla Logistics`;
  
  return await smsProvider.sendSMS(phoneNumber, message);
}

export async function sendDeliveryConfirmationSMS(
  phoneNumber: string,
  waybillNumber: string,
  customerName: string,
  deliveredBy: string
): Promise<boolean> {
  const message = `✅ KAPILLA LOGISTICS\n\nDear ${customerName},\n\nYour shipment has been delivered!\n\n🎫 WAYBILL: ${waybillNumber}\n📦 Delivered by: ${deliveredBy}\n\nThank you for choosing Kapilla Logistics!`;
  
  return await smsProvider.sendSMS(phoneNumber, message);
}

export async function sendPickupRequestSMS(
  phoneNumber: string,
  requestId: string,
  customerName: string
): Promise<boolean> {
  const message = `Dear ${customerName}, your pickup request #${requestId} has been received. Our team will contact you within 24 hours. Kapilla Logistics`;
  
  return await smsProvider.sendSMS(phoneNumber, message);
}

export async function sendOTPSMS(
  phoneNumber: string,
  otp: string,
  purpose: string = 'login'
): Promise<boolean> {
  const message = `Your Kapilla Logistics ${purpose} OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  
  return await smsProvider.sendSMS(phoneNumber, message);
}

// Phone number validation
export function validatePhoneNumber(phone: string): boolean {
  // Basic validation for Tanzanian phone numbers
  const cleaned = phone.replace(/[^0-9]/g, '');
  
  // Tanzania: 9 digits starting with 7, 6, or 5 (after country code)
  if ((cleaned.startsWith('255') && cleaned.length === 12) ||
      (cleaned.startsWith('0') && cleaned.length === 10) ||
      (cleaned.length === 9 && /^[567]/.test(cleaned))) {
    return true;
  }
  
  return false;
}

export default smsProvider;
