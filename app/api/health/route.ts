 import { NextResponse } from "next/server";
 import { db } from "@/lib/db";
 
 export const dynamic = "force-dynamic";
 
 export async function GET() {
   try {
     await db.$connect();
     await db.$queryRaw`SELECT 1`;
     return NextResponse.json({ ok: true });
   } catch (e: any) {
     return NextResponse.json(
       { ok: false, error: e?.message ?? "Unknown error" },
       { status: 500 }
     );
   }
 }
