import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const { id, name, userId } = await req.json()
    
    if (!id || !name || !userId) {
      return NextResponse.json({ error: 'ID, name and userId required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !['ADMIN', 'OPERATION_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const folder = await prisma.documentFolder.update({
      where: { id },
      data: { name: name.trim() }
    })

    return NextResponse.json(folder)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Folder name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to rename folder' }, { status: 500 })
  }
}
