import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { id: true, name: true, role: true } } },
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
    const doc = await prisma.document.create({
      data: { uploaderId, name, data, mimeType },
    })
    return NextResponse.json(doc)
  } catch {
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }
}
