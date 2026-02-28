# Kapilla Logistics Deployment Guide

## Phase 1: Database Setup (Supabase)

1.  **Create Project**: Go to [database.new](https://database.new) and create a new Supabase project.
2.  **Get Credentials**:
    *   Go to **Project Settings** (gear icon) -> **Database**.
    *   Scroll to **Connection parameters**.
    *   You need two URLs:
        *   **Transaction Mode (Port 6543)** -> This is your `DATABASE_URL`.
        *   **Session Mode (Port 5432)** -> This is your `DIRECT_URL`.
3.  **Update Environment**:
    *   Open the `.env` file in your project.
    *   Replace the placeholder values in `DATABASE_URL` and `DIRECT_URL` with your actual strings.
    *   **Important**: Replace `[PASSWORD]` with the password you created in Step 1.
4.  **Push Schema**:
    *   Run this command in your terminal to create the tables in Supabase:
        ```bash
        npx prisma db push
        ```
    *   **Windows PowerShell Note**: If you see a "cannot be loaded because running scripts is disabled" error, run this command first:
        ```powershell
        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
        ```
        Then try `npx prisma db push` again.

## Phase 2: Web Deployment (Vercel)

1.  **Import Project**:
    *   Go to [vercel.com/new](https://vercel.com/new).
    *   Select the `KAPILLA` repository you just pushed to GitHub.
2.  **Configure Environment Variables**:
    *   In the "Environment Variables" section, add the following (copy from your `.env` file):
        *   `DATABASE_URL`
        *   `DIRECT_URL`
        *   `NEXTAUTH_SECRET` (You can generate a new random string for this)
        *   `NEXTAUTH_URL` (Set this to your Vercel domain, e.g., `https://kapilla-logistics.vercel.app`, or leave empty for now and update later).
3.  **Deploy**:
    *   Click **Deploy**.
    *   Wait for the build to finish.

## Phase 3: Verification

1.  Open your deployed Vercel URL.
2.  Log in with the staff credentials (create a staff user first if needed, or use the Prisma Studio to add one).
3.  To add a staff user via database:
    *   Run `npx prisma studio` locally.
    *   Go to the `User` or `Staff` table and add a record.

## Troubleshooting

*   **Database connection error**: Double-check your password in the connection string. Special characters in passwords must be URL-encoded.
*   **Build fails**: Check the "Build Logs" in Vercel.
*   **PowerShell Security Error**: If `npx` or `npm` commands fail, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in your terminal.
