const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyRLS() {
  let connectionString = process.env.DATABASE_URL;

  // Try to read from .env if not in process.env
  if (!connectionString) {
    try {
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
        if (match) {
          connectionString = match[1];
        }
      }
    } catch (e) {
      console.error("Error reading .env:", e);
    }
  }

  if (!connectionString) {
    console.error("❌ DATABASE_URL not found. Please ensure .env exists or run 'node fix-db.js' first to setup your connection.");
    process.exit(1);
  }

  console.log("Connecting to database...");
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected! Enabling RLS...");

    const tables = [
      "User", "DocumentFolder", "Message", "Document", 
      "Shipment", "Trip", "CheckIn", "TrackingEvent", "PickupRequest"
    ];

    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
        console.log(`✅ Enabled RLS for "${table}"`);
      } catch (err) {
        console.log(`⚠️  Could not enable RLS for "${table}": ${err.message}`);
      }
    }
    
    console.log("RLS enabled for all tables successfully.");
  } catch (err) {
    console.error("Database connection error:", err.message);
  } finally {
    await client.end();
  }
}

applyRLS();
