import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, name } = body
    if (!id || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const doc = await prisma.document.update({
      where: { id },
      data: { name },
    })
    return NextResponse.json(doc)
  } catch {
    return NextResponse.json({ error: 'Failed to rename document' }, { status: 500 })
  }
}
