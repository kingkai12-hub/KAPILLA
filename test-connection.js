const { Client } = require('pg');

const projectRef = 'vbgvcaqxbdtwozacwvhl';
const password = 'KapillaLogistics2025';

// More aggressive logging to find the error
async function tryConnect(host) {
    console.log(`Testing: ${host}`);
    const client = new Client({
        user: `postgres.${projectRef}`,
        password: password,
        host: host,
        port: 6543, // Transaction mode
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000 // 5 second timeout
    });

    try {
        await client.connect();
        console.log(`✅ SUCCESS! Connected to ${host}`);
        await client.end();
        return true;
    } catch (err) {
        console.log(`❌ Failed (${host}): ${err.message}`);
        await client.end();
        return false;
    }
}

const regions = [
    // AWS-0
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-eu-west-1.pooler.supabase.com',
    'aws-0-eu-west-2.pooler.supabase.com',
    'aws-0-eu-west-3.pooler.supabase.com',
    'aws-0-eu-north-1.pooler.supabase.com',
    // AWS-1 (Newer) - Retrying these specifically
    'aws-1-eu-central-1.pooler.supabase.com',
    'aws-1-eu-west-1.pooler.supabase.com',
    'aws-1-eu-west-2.pooler.supabase.com', // User hinted at this one
    'aws-1-eu-west-3.pooler.supabase.com',
    'aws-1-eu-north-1.pooler.supabase.com',

    // RARE/Other Regions (Just in case "Europe" was a broad guess)
    'aws-0-us-east-1.pooler.supabase.com', 
    'aws-0-us-west-1.pooler.supabase.com',
    'aws-0-ap-southeast-1.pooler.supabase.com',
];

(async () => {
    for (const host of regions) {
        if (await tryConnect(host)) {
            console.log(`\nFOUND IT! The correct host is: ${host}`);
            break;
        }
    }
})();
