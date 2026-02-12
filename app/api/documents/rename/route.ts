import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth'

export const runtime = 'nodejs'

const MANAGER_ROLES = ['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO']

export async function POST(request: Request) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error
  try {
    const body = await request.json()
    const { id, name } = body
    if (!id || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const userId = auth.user!.id

    const existingDoc = await prisma.document.findUnique({ where: { id } })
    if (!existingDoc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const isOwner = existingDoc.uploaderId === userId
    const isManager = requireRole(auth.user!, MANAGER_ROLES)

    if (!isOwner && !isManager) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Auto-assign folder if first 3 chars match
    // Only change folderId if a match is found. Otherwise keep existing.
    let folderId = existingDoc.folderId
    
    if (name.length >= 3) {
      const prefix = name.substring(0, 3)
      const folder = await prisma.documentFolder.findFirst({
        where: {
          name: { startsWith: prefix, mode: 'insensitive' }
        }
      })
      if (folder) {
        folderId = folder.id
      }
    }

    const doc = await prisma.document.update({
      where: { id },
      data: { name, folderId },
    })
    return NextResponse.json(doc)
  } catch {
    return NextResponse.json({ error: 'Failed to rename document' }, { status: 500 })
  }
}
