import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const requesterId = searchParams.get('userId')
  if (!id || !requesterId) {
    return NextResponse.json({ error: 'Missing id or userId' }, { status: 400 })
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: requesterId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const doc = await prisma.document.findUnique({ where: { id } })
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    const now = Date.now()
    const created = new Date(doc.createdAt).getTime()
    const canOwnerDelete = doc.uploaderId === requesterId && now - created < 60000
    const canAdminDelete = ['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO'].includes(user.role)
    if (!canOwnerDelete && !canAdminDelete) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
