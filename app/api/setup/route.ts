import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 1. Enable UUID extension
    await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 2. Create User Table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT,
        "role" TEXT NOT NULL DEFAULT 'STAFF',
        "image" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `);
    
    // Add image column if it doesn't exist (for migration)
    try {
        await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;`);
    } catch (e) {
        // Ignore if column already exists or other non-critical error
    }
    
    // 3. Create Unique Index on User Email
    // Using try-catch for index creation as 'IF NOT EXISTS' syntax support varies by PG version for indexes
    try {
        await db.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email");`);
    } catch (e: any) {
        if (!e.message.includes('already exists')) throw e;
    }

    // 4. Create Shipment Table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Shipment" (
        "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
        "waybillNumber" TEXT NOT NULL,
        "senderName" TEXT NOT NULL,
        "senderPhone" TEXT NOT NULL,
        "senderAddress" TEXT,
        "receiverName" TEXT NOT NULL,
        "receiverPhone" TEXT NOT NULL,
        "receiverAddress" TEXT,
        "origin" TEXT NOT NULL,
        "destination" TEXT NOT NULL,
        "weight" DOUBLE PRECISION,
        "price" DOUBLE PRECISION,
        "currentStatus" TEXT NOT NULL DEFAULT 'PENDING',
        "receiverSignature" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
      );
    `);

    // 5. Index for Shipment
    try {
        await db.$executeRawUnsafe(`CREATE UNIQUE INDEX "Shipment_waybillNumber_key" ON "Shipment"("waybillNumber");`);
    } catch (e: any) {
        if (!e.message.includes('already exists')) throw e;
    }

    // 6. TrackingEvent Table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TrackingEvent" (
        "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
        "shipmentId" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "location" TEXT NOT NULL,
        "remarks" TEXT,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
      );
    `);

    // 7. FK (Need to be careful about duplicate constraints)
    try {
        await db.$executeRawUnsafe(`
          ALTER TABLE "TrackingEvent" 
          ADD CONSTRAINT "TrackingEvent_shipmentId_fkey" 
          FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") 
          ON DELETE RESTRICT ON UPDATE CASCADE;
        `);
    } catch (e: any) {
        // Ignore if constraint already exists
        if (!e.message.includes('already exists')) {
             // Optional: Log it, but don't fail the whole setup if it's just a duplicate constraint
             console.log("Constraint creation skipped or failed:", e.message);
        }
    }

    // 8. Create Admin User
    await db.$executeRawUnsafe(`
      INSERT INTO "User" ("email", "password", "name", "role")
      VALUES ('admin@kapilla.com', 'admin123', 'Kapilla Admin', 'ADMIN')
      ON CONFLICT ("email") DO NOTHING;
    `);

    return NextResponse.json({ message: "Database setup completed successfully. You can now login." });
  } catch (error: any) {
    console.error("Setup failed:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
