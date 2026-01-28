import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, name, userId } = body
    if (!id || !name || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    
    // Check permissions: Owner or Manager+
    const existingDoc = await prisma.document.findUnique({ where: { id } })
    if (!existingDoc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const isOwner = existingDoc.uploaderId === userId
    const isManager = ['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO'].includes(user.role)

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
