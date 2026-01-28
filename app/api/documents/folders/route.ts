
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    if (!name || typeof name !== 'string' || !userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Valid name and userId required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const folder = await prisma.documentFolder.create({
      data: {
        name: name.trim(),
        creatorId: userId
      }
    })

    // Retroactive assignment: Move existing unassigned documents that match the new folder
    if (folder.name.length >= 3) {
      const prefix = folder.name.substring(0, 3)
      await prisma.document.updateMany({
        where: {
          folderId: null,
          name: {
            startsWith: prefix,
            mode: 'insensitive'
          }
        },
        data: {
          folderId: folder.id
        }
      })
    }

    return NextResponse.json(folder)
  } catch (error: any) {
    console.error('Folder creation error:', error)
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Folder name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error?.message || 'Failed to create folder' }, { status: 500 })
  }
}
