import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID and userId required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !['ADMIN', 'OPERATION_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Move documents to root (null) before deleting folder
    await prisma.document.updateMany({
      where: { folderId: id },
      data: { folderId: null }
    })

    await prisma.documentFolder.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete folder error:', error)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}
