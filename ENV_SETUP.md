# Environment Configuration for Email & SMS

## Email Configuration (SMTP)

Add these to your `.env.local` file:

```bash
# Email Service Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Admin notification email
ADMIN_EMAIL=express@kapillagroup.co.tz
```

### Gmail Setup Instructions:
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings → Security → App passwords
3. Generate a new app password for "Kapilla Logistics"
4. Use the app password as `EMAIL_PASS`

## SMS Configuration

Choose one of the following providers:

### Option 1: Africa's Talking (Recommended for Tanzania)
```bash
SMS_PROVIDER=africastalking
AFRICASTALKING_API_KEY=your-api-key
AFRICASTALKING_USERNAME=your-username
AFRICASTALKING_SENDER=KAPILLA
```

### Option 2: Twilio
```bash
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Option 3: Simulation (Development Only)
```bash
SMS_PROVIDER=simulation
```

## Installation Requirements

Install the required packages:

```bash
npm install nodemailer twilio
```

For Africa's Talking, the service uses HTTP API directly (no additional package needed).

## Phone Number Format

The system supports Tanzanian phone numbers in these formats:
- +255712345678
- 0712345678
- 712345678

## Email Templates Available

1. **Shipment Updates** - Automatic notifications for status changes
2. **Pickup Requests** - Confirmation when pickup requests are submitted
3. **Welcome Emails** - For new staff account creation
4. **Admin Notifications** - Internal alerts for new shipments

## SMS Templates Available

1. **Shipment Created** - Initial shipment confirmation
2. **Shipment Updates** - Status change notifications
3. **Delivery Confirmation** - When shipment is delivered
4. **Pickup Requests** - Pickup request confirmations
5. **OTP Messages** - For secure authentication

## Testing

To test email functionality:
1. Set `SMS_PROVIDER=simulation` for SMS testing
2. Use your own email for `EMAIL_USER`
3. Check server console logs for email send status

## Security Notes

- Never commit `.env.local` to version control
- Use app passwords instead of regular passwords for Gmail
- Rotate API keys regularly
- Monitor email/SMS usage to prevent abuse
