import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, name } = body
    if (!id || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Auto-assign folder if first 3 chars match
    let folderId = null
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
