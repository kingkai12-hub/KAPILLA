// Test the tracking form submission
const puppeteer = require('puppeteer');

async function testTrackingForm() {
  console.log('🧪 Testing tracking form submission...');
  
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('Browser Console:', msg.type(), msg.text());
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.error('Browser Page Error:', error.message);
    });
    
    await page.goto('http://localhost:3001');
    await page.waitForSelector('input[placeholder*="Waybill"]');
    
    // Type the waybill number
    await page.type('input[placeholder*="Waybill"]', 'KPL-26020002');
    
    // Click the track button
    await page.click('button[type="submit"]');
    
    // Wait for results
    await page.waitForTimeout(5000);
    
    // Check if error message appears
    const errorElement = await page.$('text=Something went wrong');
    if (errorElement) {
      console.log('❌ Error found on page');
      const errorText = await page.evaluate(el => el.textContent, errorElement);
      console.log('Error text:', errorText);
    } else {
      console.log('✅ No error message found');
      
      // Check if tracking results appear
      const resultsElement = await page.$('text=KPL-26020002');
      if (resultsElement) {
        console.log('✅ Tracking results displayed successfully');
      } else {
        console.log('⚠️ No tracking results found');
      }
    }
    
    await browser.close();
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testTrackingForm();
