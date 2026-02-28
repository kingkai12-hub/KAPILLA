import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const STAFF_ROLES = ['ADMIN', 'STAFF', 'DRIVER', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT']
const ADMIN_LOCKED_ROLES = ['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO']

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error
  if (!requireRole(auth.user!, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const isAuthorized = ADMIN_LOCKED_ROLES.includes(auth.user!.role)

    let where: any = {}
    if (folderId === 'null') {
      where = { folderId: null }
    } else if (folderId) {
      where = { folderId }
    }

    // If not authorized, exclude documents from locked folders
    if (!isAuthorized) {
      where = {
        ...where,
        OR: [
          { folderId: null },
          { folder: { isLocked: false } }
        ]
      }
    }

    const [docs, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
        select: {
          id: true,
          name: true,
          mimeType: true,
          createdAt: true,
          updatedAt: true,
          uploaderId: true,
          folderId: true,
          uploader: { select: { id: true, name: true, role: true } },
          folder: true
        }
      }),
      prisma.document.count({ where })
    ])
    
    return NextResponse.json({
      docs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error
  if (!requireRole(auth.user!, STAFF_ROLES)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    // Support both JSON (legacy) and FormData (new)
    const contentType = request.headers.get('content-type') || ''
    
    let name: string | undefined, data: string | undefined, mimeType: string | undefined, folderId: string | undefined

    if (contentType.includes('application/json')) {
      const body = await request.json()
      name = body.name
      data = body.data
      mimeType = body.mimeType
      folderId = body.folderId
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      name = formData.get('name') as string
      const file = formData.get('file') as File
      folderId = formData.get('folderId') as string
      
      if (file) {
        // SECURITY: Validate File Size (Max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: 'File size too large (Max 10MB)' }, { status: 413 })
        }

        // SECURITY: Validate MIME Type
        const ALLOWED_MIME_TYPES = [
          'application/pdf',
          'image/jpeg', 
          'image/png', 
          'image/webp',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.rar',
          'application/zip',
          'application/x-zip-compressed',
          'application/octet-stream' // Be careful with this, but sometimes needed for binary
        ]
        
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          return NextResponse.json({ error: 'Invalid file type' }, { status: 415 })
        }

        mimeType = file.type
        // Convert File to Base64
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        data = `data:${file.type};base64,${buffer.toString('base64')}`
      }
    }

    if (!name || !data || !mimeType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const uploaderId = auth.user!.id

    const effectiveFolderId = (folderId === 'null' || !folderId) ? null : folderId

    // Auto-assign folder if first 3 chars match AND no folderId was provided
    let finalFolderId = effectiveFolderId
    if (!finalFolderId && name.length >= 3) {
      const prefix = name.substring(0, 3)
      const folder = await prisma.documentFolder.findFirst({
        where: {
          name: { startsWith: prefix, mode: 'insensitive' }
        }
      })
      if (folder) {
        finalFolderId = folder.id
      }
    }

    const doc = await prisma.document.create({
      data: { 
        uploaderId, 
        name, 
        data, 
        mimeType, 
        folderId: finalFolderId 
      },
    })
    return NextResponse.json(doc)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }
}
