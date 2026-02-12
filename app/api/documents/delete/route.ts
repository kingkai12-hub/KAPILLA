import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth'

export const runtime = 'nodejs'

const ADMIN_DELETE_ROLES = ['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO']

export async function DELETE(request: Request) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }
  const requesterId = auth.user!.id
  try {
    const doc = await prisma.document.findUnique({ where: { id } })
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    const now = Date.now()
    const created = new Date(doc.createdAt).getTime()
    const canOwnerDelete = doc.uploaderId === requesterId && now - created < 60000
    const canAdminDelete = ADMIN_DELETE_ROLES.includes(auth.user!.role)
    if (!canOwnerDelete && !canAdminDelete) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
