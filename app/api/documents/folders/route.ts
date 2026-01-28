
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const folders = await prisma.documentFolder.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { documents: true }
        }
      }
    })
    return NextResponse.json(folders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, userId } = await req.json()
    if (!name || !userId) {
      return NextResponse.json({ error: 'Name and userId required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !['ADMIN', 'OPERATION_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const folder = await prisma.documentFolder.create({
      data: {
        name: name.trim(),
        creatorId: userId
      }
    })

    return NextResponse.json(folder)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}
