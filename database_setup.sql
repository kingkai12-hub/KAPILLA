-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User Table
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index on User Email
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Create Shipment Table
CREATE TABLE "Shipment" (
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

-- Create Unique Index on Waybill Number
CREATE UNIQUE INDEX "Shipment_waybillNumber_key" ON "Shipment"("waybillNumber");

-- Create TrackingEvent Table
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "shipmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "remarks" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- Add Foreign Key for TrackingEvent -> Shipment
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert a Default Admin User (Optional)
-- Email: admin@kapilla.com
-- Password: admin (Hashed version or plain text if your auth allows it, but normally should be hashed)
-- INSERT INTO "User" ("email", "password", "name", "role") VALUES ('admin@kapilla.com', '$2b$10$YourHashedPasswordHere', 'Admin', 'ADMIN');
