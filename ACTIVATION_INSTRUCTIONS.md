# 🚀 ACTIVATE EMAIL & SMS NOTIFICATIONS

## Step 1: Create Environment File

Create a new file called `.env.local` in your project root with these settings:

```bash
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Admin notification email
ADMIN_EMAIL=express@kapillagroup.co.tz

# SMS Configuration (Start with Simulation for testing)
SMS_PROVIDER=simulation

# Later, change to real provider:
# SMS_PROVIDER=africastalking
# AFRICASTALKING_API_KEY=your-api-key
# AFRICASTALKING_USERNAME=your-username
# AFRICASTALKING_SENDER=KAPILLA
```

## Step 2: Gmail Setup (5 minutes)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" for the app
   - Select "Other (Custom name)" and enter "Kapilla Logistics"
   - Copy the 16-character password
3. **Update Environment**:
   - Replace `your-email@gmail.com` with your actual Gmail
   - Replace `your-app-password` with the 16-character password

## Step 3: Test the System

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test Email Notifications**:
   - Create a new shipment with an email address
   - Check your email for the shipment notification
   - Create a new staff account to test welcome emails

3. **Test SMS Notifications**:
   - With `SMS_PROVIDER=simulation`, SMS will appear in console logs
   - Check the server console for SMS simulation messages

## Step 4: Deploy to Production

1. **Add Environment Variables to Vercel**:
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add all the variables from Step 1

2. **Redeploy**:
   - Push changes or trigger manual redeploy
   - Notifications will be active on production

## Step 5: Optional - Real SMS Setup

### Africa's Talking (Recommended for Tanzania)
1. Sign up at: https://account.africastalking.com/
2. Get API key and username
3. Update environment variables:
   ```bash
   SMS_PROVIDER=africastalking
   AFRICASTALKING_API_KEY=your-api-key
   AFRICASTALKING_USERNAME=your-username
   AFRICASTALKING_SENDER=KAPILLA
   ```

### Twilio (Alternative)
1. Sign up at: https://www.twilio.com/
2. Get Account SID, Auth Token, and phone number
3. Update environment variables:
   ```bash
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

## 🎯 What Gets Activated

### ✅ Email Notifications:
- Shipment creation confirmations
- Shipment status updates
- Delivery confirmations
- Pickup request confirmations
- Welcome emails for new staff
- Admin notifications for all events

### ✅ SMS Notifications:
- Shipment creation confirmations
- Shipment status updates
- Delivery confirmations
- Pickup request confirmations
- OTP messages for authentication

### ✅ Features:
- Beautiful HTML email templates
- Professional SMS messages
- Real-time delivery
- Error handling and logging
- Phone number validation

## 🧪 Quick Test

After setup, try these:

1. **Create a Shipment**:
   - Enter your email in sender/receiver field
   - Check email for shipment notification
   - Check console for SMS simulation

2. **Update Tracking**:
   - Change shipment status
   - Check for update notifications

3. **Create Pickup Request**:
   - Submit pickup request
   - Check for confirmation notifications

4. **Create Staff Account**:
   - Add new user in admin panel
   - Check for welcome email

## 🔧 Troubleshooting

### Email Not Working:
- Check Gmail app password is correct
- Ensure 2-factor authentication is enabled
- Verify SMTP settings

### SMS Not Working:
- Start with `SMS_PROVIDER=simulation` to test
- Check API keys for real providers
- Verify phone number format

### General Issues:
- Restart development server after changing env vars
- Check server console for error messages
- Ensure all environment variables are set

## 📞 Support

If you need help:
- Check server console logs
- Review ENV_SETUP.md for detailed instructions
- Test with simulation mode first

**Your system will be fully activated once you complete Step 1 & 2!** 🚀
