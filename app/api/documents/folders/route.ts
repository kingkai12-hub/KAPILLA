import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const STAFF_ROLES = ['ADMIN', 'STAFF', 'DRIVER', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT']
const ADMIN_LOCKED_ROLES = ['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO']

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  if (!requireRole(auth.user!, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const isAuthorized = ADMIN_LOCKED_ROLES.includes(auth.user!.role)
    const whereClause = isAuthorized ? {} : { isLocked: false }

    const folders = await prisma.documentFolder.findMany({
      where: whereClause,
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
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  if (!requireRole(auth.user!, ADMIN_LOCKED_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { name, isLocked } = await req.json()
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Valid name required' }, { status: 400 })
    }
    const userId = auth.user!.id

    const folder = await prisma.documentFolder.create({
      data: {
        name: name.trim(),
        creatorId: userId,
        isLocked: !!isLocked
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
