const fetch = require('node-fetch');

async function testTracking() {
  try {
    console.log('Testing KPL-26020002 tracking...');
    
    // Test API endpoint
    const response = await fetch('http://localhost:3000/api/shipments/KPL-26020002');
    const data = await response.json();
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ Waybill:', data.waybillNumber);
    console.log('✅ Origin:', data.origin);
    console.log('✅ Destination:', data.destination);
    console.log('✅ Status:', data.currentStatus);
    console.log('✅ Events:', data.events?.length || 0);
    console.log('✅ Trips:', data.trips?.length || 0);
    
    // Check location coordinates
    const originCoords = {
      "Dar es Salaam": { lat: -6.8151812, lng: 39.2864692 },
      "Mbeya": { lat: -8.9094, lng: 33.4608 }
    };
    
    if (originCoords[data.origin] && originCoords[data.destination]) {
      console.log('✅ Location coordinates found');
      console.log('   Origin:', originCoords[data.origin]);
      console.log('   Destination:', originCoords[data.destination]);
    } else {
      console.log('❌ Missing location coordinates');
      console.log('   Origin found:', !!originCoords[data.origin]);
      console.log('   Destination found:', !!originCoords[data.destination]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTracking();
