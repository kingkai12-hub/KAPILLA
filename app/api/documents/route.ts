import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')

    const whereClause = folderId 
      ? { folderId } 
      : (folderId === null ? undefined : { folderId: null }) 
      
    // If folderId is 'all', fetch everything (legacy behavior support if needed, or for search)
    // But better to be explicit. 
    // Let's refine: 
    // if ?folderId=xxx -> fetch docs in that folder
    // if ?folderId=null (string) -> fetch docs with NO folder
    // if no param -> fetch ALL docs (current behavior, but slow) -> let's default to ALL for safety but UI should use params

    let where: any = {}
    if (folderId === 'null') {
      where = { folderId: null }
    } else if (folderId) {
      where = { folderId }
    }

    const docs = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { 
        uploader: { select: { id: true, name: true, role: true } },
        folder: true
      },
    })
    return NextResponse.json(docs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { uploaderId, name, data, mimeType } = body
    if (!uploaderId || !name || !data || !mimeType) {
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

    const doc = await prisma.document.create({
      data: { uploaderId, name, data, mimeType, folderId },
    })
    return NextResponse.json(doc)
  } catch {
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }
}
