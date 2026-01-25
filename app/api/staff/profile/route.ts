import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, password, image, workId, phoneNumber } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const dataToUpdate: any = {
      name,
      image,
      workId,
      phoneNumber
    };

    if (password) {
      dataToUpdate.password = password;
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: dataToUpdate,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
