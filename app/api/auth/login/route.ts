import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // --- AUTO-HEAL: Ensure Admin User Exists ---
    if (email === 'admin@kapilla.com' && password === 'admin123') {
      try {
        const adminUser = await db.user.findUnique({ where: { email } });
        
        if (!adminUser) {
          // Create Admin if missing
          const newUser = await db.user.create({
            data: {
              email: 'admin@kapilla.com',
              password: 'admin123',
              name: 'Kapilla Admin',
              role: 'ADMIN'
            }
          });
          const { password: _, ...userWithoutPassword } = newUser;
          return NextResponse.json(userWithoutPassword);
        } 
        // SECURITY FIX: Removed auto-reset of password to prevent backdoor access.
        // If admin exists but password is wrong, fall through to normal check.
      } catch (e) {
        console.error("Auto-heal failed:", e);
        // Continue to normal login flow if this fails
      }
    }
    // -------------------------------------------

    // In production, use bcrypt to compare hashed passwords!
    // For this demo, we use plain text comparison as requested for the "working system" setup.
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Return user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('[AUTH_LOGIN]', error);
    return NextResponse.json({ 
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}
