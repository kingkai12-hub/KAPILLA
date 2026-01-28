"use client"

import React, { useEffect, useState, useRef } from 'react'
import { FileText, Folder, Plus, Upload, Trash2, Eye, ChevronLeft, ChevronRight, Loader2, Pencil, Lock } from 'lucide-react'

// Types
interface Document {
  id: string
  name: string
  mimeType: string
  createdAt: string
  uploader: { name: string }
  folderId: string | null
}

interface Folder {
  id: string
  name: string
  isLocked: boolean
  _count: { documents: number }
}

export default function DocumentsPage() {
  // State
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  
  // Loading & Error States
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auth Check
  useEffect(() => {
    const u = localStorage.getItem('kapilla_user')
    if (u) setCurrentUser(JSON.parse(u))
  }, [])

  // Initial Load
  useEffect(() => {
    if (currentUser) {
      fetchFolders()
      fetchDocuments(1)
    }
  }, [currentUser, currentFolder])

  // Fetch Folders
  const fetchFolders = async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/documents/folders?ts=${Date.now()}&userId=${currentUser.id}`, { cache: 'no-store' })
      if (res.ok) setFolders(await res.json())
    } catch (e) {
      console.error('Failed to load folders', e)
    }
  }

  // Fetch Documents
  const fetchDocuments = async (pageNum: number) => {
    if (!currentUser) return
    setLoading(true)
    setError(null)
    try {
      const folderParam = currentFolder ? `folderId=${currentFolder.id}` : 'folderId=null'
      const res = await fetch(`/api/documents?${folderParam}&page=${pageNum}&limit=50&ts=${Date.now()}&userId=${currentUser.id}`)
      
      if (!res.ok) throw new Error('Failed to load documents')
      
      const data = await res.json()
      setDocuments(data.docs || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setPage(pageNum)
    } catch (err) {
      setError('Could not load documents. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // File Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)
    formData.append('uploaderId', currentUser.id)
    if (currentFolder) formData.append('folderId', currentFolder.id)

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData // Browser automatically sets Content-Type to multipart/form-data
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      // Success
      alert('Document uploaded successfully!')
      fetchDocuments(1) // Refresh list
      fetchFolders() // Refresh counts
    } catch (err: any) {
      alert(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Delete Document
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      const res = await fetch(`/api/documents/delete?id=${id}&userId=${currentUser?.id}`, { method: 'DELETE' })
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id))
        fetchFolders()
      } else {
        alert('Failed to delete document')
      }
    } catch {
      alert('Error deleting document')
    }
  }

  // Create Folder
  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:')
    if (!name || !currentUser) return

    let isLocked = false
    // Allow admins/managers to lock folders
    if (['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO'].includes(currentUser.role)) {
      if (confirm('Do you want to LOCK this folder? (Only Admins/Managers will be able to access it)')) {
        isLocked = true
      }
    }

    try {
      const res = await fetch('/api/documents/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userId: currentUser.id, isLocked })
      })
      if (res.ok) {
        fetchFolders()
      } else {
        alert('Failed to create folder')
      }
    } catch {
      alert('Error creating folder')
    }
  }

  // Rename Document
  const handleRename = async (doc: Document) => {
    const newName = prompt('Enter new name:', doc.name)
    if (!newName || newName === doc.name || !currentUser) return

    try {
      const res = await fetch('/api/documents/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, name: newName, userId: currentUser.id })
      })
      if (res.ok) {
        // Optimistic update
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, name: newName } : d))
        fetchFolders() // Folder counts might change due to auto-assign
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to rename document')
      }
    } catch {
      alert('Error renaming document')
    }
  }

  // Render
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {currentFolder && (
              <button onClick={() => setCurrentFolder(null)} className="hover:bg-slate-100 p-1 rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {currentFolder ? currentFolder.name : 'Documents Library'}
          </h1>
          <p className="text-slate-500 text-sm">Manage and organize your digital files</p>
        </div>
        
        <div className="flex gap-2">
          {!currentFolder && (
            <button 
              onClick={handleCreateFolder}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> New Folder
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleUpload} 
            accept="image/*,application/pdf"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Folders Grid (Only on Root) */}
      {!currentFolder && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {folders.map(folder => (
            <div 
              key={folder.id}
              onClick={() => setCurrentFolder(folder)}
              className="bg-white p-4 rounded-xl border hover:shadow-md cursor-pointer transition-all group relative"
            >
              {folder.isLocked && (
                <div className="absolute top-2 right-2 text-amber-500" title="Locked Folder">
                  <Lock className="w-4 h-4" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <Folder className={`w-10 h-10 ${folder.isLocked ? 'text-amber-500 fill-amber-100' : 'text-yellow-500 fill-yellow-500'}`} />
                <div className="overflow-hidden">
                  <h3 className="font-medium truncate" title={folder.name}>{folder.name}</h3>
                  <p className="text-xs text-slate-500">{folder._count?.documents || 0} files</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center text-sm">
          {error}
          <button onClick={() => fetchDocuments(page)} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">Type</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">Uploaded By</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">Date</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No documents found in this folder.
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[150px] md:max-w-[300px]" title={doc.name}>{doc.name}</span>
                      </div>
                      {/* Mobile-only details */}
                      <div className="md:hidden text-xs text-slate-500 mt-1 pl-6">
                        {new Date(doc.createdAt).toLocaleDateString()} • {doc.uploader?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 hidden md:table-cell">{doc.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</td>
                    <td className="px-6 py-4 text-slate-500 hidden md:table-cell">{doc.uploader?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-slate-500 hidden md:table-cell">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a 
                          href={`/api/documents/download?id=${doc.id}`} 
                          target="_blank"
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="View/Download"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleRename(doc)}
                          className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors"
                          title="Rename"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center bg-slate-50">
            <button 
              disabled={page <= 1}
              onClick={() => fetchDocuments(page - 1)}
              className="p-2 border rounded-lg hover:bg-white disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
            <button 
              disabled={page >= totalPages}
              onClick={() => fetchDocuments(page + 1)}
              className="p-2 border rounded-lg hover:bg-white disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}