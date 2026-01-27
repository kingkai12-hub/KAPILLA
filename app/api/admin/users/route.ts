import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    const { name, email, password, role, workId, phoneNumber } = body;

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

    const newUser = await db.user.create({
      data: {
        name,
        email,
        password, // In production, hash this!
        role: role || 'STAFF',
        workId: workId || null,
        phoneNumber: phoneNumber || null
      }
    });

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
    const { id, name, email, role, password, workId, phoneNumber } = body;

    const data: any = { name, email, role, workId, phoneNumber };
    if (password) data.password = password;

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

    // Check if user is admin before deleting
    const userToDelete = await db.user.findUnique({ where: { id } });
    
    if (!userToDelete) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userToDelete.role === 'ADMIN') {
        return NextResponse.json({ error: 'Cannot delete an ADMIN account' }, { status: 403 });
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
