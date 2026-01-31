import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const { folderId, userId, isLocked } = await req.json()

    if (!folderId || !userId) {
      return NextResponse.json({ error: 'Folder ID and User ID required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    
    // Only High-level roles can lock/unlock
    if (!user || !['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized: Only Admins can lock folders' }, { status: 403 })
    }

    const folder = await prisma.documentFolder.update({
      where: { id: folderId },
      data: { isLocked: !!isLocked }
    })

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Lock update error:', error)
    return NextResponse.json({ error: 'Failed to update folder lock status' }, { status: 500 })
  }
}
