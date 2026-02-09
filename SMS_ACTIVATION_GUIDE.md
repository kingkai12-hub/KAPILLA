# 📱 SMS ACTIVATION GUIDE

## 🚨 Current Issue: SMS in Simulation Mode

Your SMS is set to `SMS_PROVIDER=simulation`, which means:
- ✅ SMS messages appear in server console
- ❌ No real SMS sent to phones
- ❌ Customers don't receive SMS

## 🚀 SOLUTION: Set Up Real SMS Provider

### **Option 1: Africa's Talking (Recommended for Tanzania)**

#### **Step 1: Sign Up**
1. Go to: https://account.africastalking.com/
2. Create free account
3. Verify your email and phone

#### **Step 2: Get API Credentials**
1. Login to Africa's Talking dashboard
2. Go to: Settings → API Key
3. Copy your **API Key**
4. Note your **Username** (usually your email/phone)

#### **Step 3: Update Configuration**
Replace your .env.local file with:
```bash
# Email Configuration - Outlook (No DNS required)
EMAIL_USER=express@kapillagroup.co.tz
EMAIL_PASS=Kapilla@2024
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587

# Admin Email
ADMIN_EMAIL=express@kapillagroup.co.tz

# SMS Configuration - Africa's Talking (REAL SMS)
SMS_PROVIDER=africastalking
AFRICASTALKING_API_KEY=your-api-key-here
AFRICASTALKING_USERNAME=your-username-here
AFRICASTALKING_SENDER=KAPILLA
```

### **Option 2: Twilio (International)**

#### **Step 1: Sign Up**
1. Go to: https://www.twilio.com/
2. Create free account
3. Get a phone number

#### **Step 2: Get Credentials**
1. Go to: Console → Settings → General
2. Copy **Account SID** and **Auth Token**
3. Note your **Twilio Phone Number**

#### **Step 3: Update Configuration**
```bash
# SMS Configuration - Twilio (REAL SMS)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🧪 **Quick Test with Simulation**

If you want to see SMS working right now:
1. **Check your server console** when creating shipments
2. You'll see SMS messages like:
   ```
   --- SMS SIMULATION ---
   To: +255712345678
   Message: 📦 KAPILLA LOGISTICS...
   ----------------------
   ```

## 🎯 **What I Recommend:**

### **For Tanzania: Use Africa's Talking**
- ✅ Local Tanzanian provider
- ✅ Better rates for local SMS
- ✅ Reliable delivery
- ✅ Easy setup

### **Quick Setup Steps:**
1. **Sign up**: https://account.africastalking.com/
2. **Get API Key**: From dashboard
3. **Tell me your credentials** and I'll update your file
4. **Restart server** and test real SMS

## 📞 **Phone Number Format**

The system supports:
- `+255712345678` (International format)
- `0712345678` (Local format)
- `712345678` (Short format)

## 🚀 **What Do You Want?**

**Option A**: "Africa's Talking" - I'll help you set it up
**Option B**: "Twilio" - I'll help you set it up  
**Option C**: "Test Simulation" - I'll show you console messages
**Option D**: "Skip SMS" - Keep email notifications only

## 💰 **Costs:**
- **Africa's Talking**: ~$0.007 per SMS to Tanzania
- **Twilio**: ~$0.08 per SMS (more expensive)
- **Free Trial**: Both providers offer free credits

## 🎯 **Next Steps:**

1. **Choose your SMS provider**
2. **Sign up and get credentials**
3. **Tell me the API details**
4. **I'll update your configuration**
5. **Test real SMS delivery**

**Which SMS provider would you like to use?** 📱

## 🔧 **I'm Ready To:**
- Update your .env.local file
- Configure the SMS provider
- Test real SMS delivery
- Troubleshoot any issues

**Just choose your provider and I'll handle the setup!** 🚀
