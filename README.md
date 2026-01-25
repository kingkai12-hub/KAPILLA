# Kapilla Logistics Management System

A comprehensive logistics management system for tracking shipments, managing staff, and printing waybills.

## Features
- **Public Tracking**: Customers can track shipments via waybill number.
- **Staff Portal**: Secure dashboard for managing shipments.
- **Waybill Generation**: Printable waybills with QR codes.
- **Proof of Delivery (POD)**: Digital signature capture for deliveries.
- **Dark Mode**: Fully supported UI theme.

## Deployment

Please refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on how to deploy this application to Vercel with a Supabase database.

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Set up environment variables:
    - Copy `.env.example` to `.env`
    - Update database credentials.

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000).
