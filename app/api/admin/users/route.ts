import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail, emailTemplates } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function generateWorkId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  for (let i = 0; i < 5; i++) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const candidate = `KPL-WRK-${yy}${mm}-${suffix}`;
    const exists = await db.user.findUnique({ where: { workId: candidate } });
    if (!exists) return candidate;
  }
  return `KPL-WRK-${Date.now().toString().slice(-6)}`;
}

// GET: List all users
export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        workId: true,
        phoneNumber: true,
        isDisabled: true,
        lastActive: true,
        createdAt: true,
        // Exclude password
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Create new user
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, workId, phoneNumber, isDisabled } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    if (workId) {
      const existingWorkId = await db.user.findUnique({ where: { workId } });
      if (existingWorkId) {
        return NextResponse.json({ error: 'Work ID already exists' }, { status: 409 });
      }
    }

    const finalWorkId = workId || await generateWorkId();

    const newUser = await db.user.create({
      data: {
        name,
        email,
        password, // In production, hash this!
        role: role || 'STAFF',
        workId: finalWorkId,
        phoneNumber: phoneNumber || null,
        isDisabled: !!isDisabled
      }
    });

    // Send welcome email to new user
    try {
      const welcomeTemplate = emailTemplates.welcomeEmail(name, password);
      await sendEmail({
        to: email,
        ...welcomeTemplate
      });
      
      // Also notify admin about new user creation
      const adminEmail = process.env.ADMIN_EMAIL || 'express@kapillagroup.co.tz';
      await sendEmail({
        to: adminEmail,
        subject: `New Staff Account Created - ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">New Staff Account</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Kapilla Group Ltd</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-bottom: 20px;">Account Details:</h2>
              <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">Name: ${name}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Email: ${email}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Role: ${role || 'STAFF'}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Work ID: ${finalWorkId}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Phone: ${phoneNumber || 'Not provided'}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #667eea; font-weight: bold;">Status: ${isDisabled ? 'DISABLED' : 'ACTIVE'}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://kapillagroup.vercel.app/staff/admin/users" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                  View in Staff Portal
                </a>
              </div>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the user creation if email fails
    }

    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Create User Error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Unique constraint violation. Email or Work ID already exists.' }, { status: 409 });
    }
    return NextResponse.json({ 
      error: 'Failed to create user', 
      details: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}

// PUT: Update user
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, role, password, workId, phoneNumber, isDisabled } = body;

    const data: any = { name, email, role, workId, phoneNumber };
    if (password) data.password = password;
    if (typeof isDisabled === 'boolean') {
      // Prevent disabling executive/admin accounts to avoid lockout
      const target = await db.user.findUnique({ where: { id } });
      if (target && ['ADMIN', 'MD', 'CEO'].includes(target.role) && isDisabled) {
        return NextResponse.json({ error: 'Cannot disable an Executive/Admin account' }, { status: 403 });
      }
      data.isDisabled = isDisabled;
    }

    const updatedUser = await db.user.update({
      where: { id },
      data
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Unique constraint violation. Email or Work ID already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE: Remove user
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const userToDelete = await db.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (['ADMIN', 'MD', 'CEO'].includes(userToDelete.role)) {
      return NextResponse.json({ error: 'Cannot delete an Executive/Admin account' }, { status: 403 });
    }

    try {
      await db.user.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch (error: any) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Cannot delete: user has related records (e.g., shipments, documents, requests). Remove or reassign related data first.' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete user', details: error?.message }, { status: 500 });
  }
}
