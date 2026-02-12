import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ADMIN_LOCK_ROLES = ['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO']

export async function POST(req: Request) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  if (!requireRole(auth.user!, ADMIN_LOCK_ROLES)) {
    return NextResponse.json({ error: 'Only Admins can lock folders' }, { status: 403 })
  }
  try {
    const { folderId, isLocked } = await req.json()

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID required' }, { status: 400 })
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
