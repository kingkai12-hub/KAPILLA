
// Basic SMS Service Implementation
// In a real production environment, you would use a provider like Twilio, Africa's Talking, or Infobip.
// For now, this service simulates sending an SMS by logging it to the server console.

export async function sendShipmentCreatedSMS(
  phoneNumber: string,
  waybillNumber: string,
  senderName: string,
  destination: string
) {
  try {
    // 1. Format phone number (Basic cleaning)
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');

    // 2. Create the message content
    const message = `Dear ${senderName}, your shipment (Waybill: ${waybillNumber}) to ${destination} has been created successfully. Thank you for choosing Kapilla Logistics!`;

    // 3. Log the SMS (Simulating the send action)
    console.log('--- SMS SIMULATION ---');
    console.log(`To: ${formattedPhone}`);
    console.log(`Message: ${message}`);
    console.log('----------------------');

    // NOTE: To integrate a real SMS provider (e.g., Twilio), you would add your API call here.
    // Example:
    // await twilioClient.messages.create({ body: message, to: formattedPhone, from: '+1234567890' });

    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}
