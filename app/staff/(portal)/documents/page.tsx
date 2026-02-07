"use client"

import React, { useEffect, useState, useRef } from 'react'
import { FileText, Folder, Plus, Upload, Trash2, Eye, ChevronLeft, ChevronRight, Loader2, Pencil, Lock, Unlock } from 'lucide-react'

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

  // Modals
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderLocked, setNewFolderLocked] = useState(false)

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

  // Create Folder (Submit)
  const submitCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName || !currentUser) return

    try {
      const res = await fetch('/api/documents/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newFolderName, 
          userId: currentUser.id, 
          isLocked: newFolderLocked 
        })
      })
      if (res.ok) {
        fetchFolders()
        setShowCreateFolder(false)
        setNewFolderName('')
        setNewFolderLocked(false)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create folder')
      }
    } catch {
      alert('Error creating folder')
    }
  }

  // Toggle Lock
  const handleToggleLock = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUser) return
    
    // Check Permissions
    if (!['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO'].includes(currentUser.role)) {
       alert('Only Admins can lock/unlock folders')
       return
    }

    const newLockState = !folder.isLocked
    if (!confirm(`Are you sure you want to ${newLockState ? 'LOCK' : 'UNLOCK'} this folder?`)) return

    try {
       const res = await fetch('/api/documents/folders/lock', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ folderId: folder.id, userId: currentUser.id, isLocked: newLockState })
       })

       if (res.ok) {
         // Optimistic Update
         setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, isLocked: newLockState } : f))
       } else {
         alert('Failed to update lock status')
       }
    } catch {
       alert('Error updating lock status')
    }
  }

  // Delete Folder
  const handleDeleteFolder = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUser) return
    if (!['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO'].includes(currentUser.role)) {
      alert('Only Admins can delete folders')
      return
    }

    if (!confirm(`Are you sure you want to delete folder "${folder.name}"? Documents inside will be moved to the main library.`)) return

    try {
      const res = await fetch(`/api/documents/folders/delete?id=${folder.id}&userId=${currentUser.id}`, { method: 'DELETE' })
      if (res.ok) {
        setFolders(prev => prev.filter(f => f.id !== folder.id))
      } else {
        alert('Failed to delete folder')
      }
    } catch {
      alert('Error deleting folder')
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
  <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          {currentFolder && (
            <button onClick={() => setCurrentFolder(null)} className="hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {currentFolder ? currentFolder.name : 'Documents Library'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage and organize your digital files</p>
      </div>
      
      <div className="flex flex-wrap gap-2 w-full md:w-auto">
        {!currentFolder && (
          <button 
            onClick={() => setShowCreateFolder(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-sm font-semibold whitespace-nowrap text-slate-900 dark:text-white"
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
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
    </div>

    {/* Create Folder Modal */}
    {showCreateFolder && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-medium flex justify-between items-center">
            <h3 className="text-slate-900 dark:text-white">Create New Folder</h3>
            <button onClick={() => setShowCreateFolder(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">&times;</button>
          </div>
          <form onSubmit={submitCreateFolder} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Folder Name</label>
              <input 
                type="text" 
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                placeholder="e.g., Invoices 2024"
                required
              />
            </div>
            
            {currentUser && ['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO'].includes(currentUser.role) && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <input 
                  type="checkbox" 
                  id="lockFolder"
                  checked={newFolderLocked}
                  onChange={(e) => setNewFolderLocked(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="lockFolder" className="text-sm text-amber-800 flex items-center gap-1 cursor-pointer">
                  <Lock className="w-3 h-3" />
                  Lock Folder (Admin Only Access)
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold disabled:opacity-50"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Folders Grid (Only on Root) */}
    {!currentFolder && (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {folders.map(folder => (
          <div 
            key={folder.id}
            onClick={() => setCurrentFolder(folder)}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border hover:shadow-md cursor-pointer transition-all group relative"
          >
            {/* Lock Indicator (Non-Admins) */}
            {folder.isLocked && (!currentUser || !['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO'].includes(currentUser.role)) && (
              <div className="absolute top-2 right-2 text-amber-500" title="Locked Folder">
                <Lock className="w-4 h-4" />
              </div>
            )}

            {/* Admin Controls */}
            {currentUser && ['ADMIN', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO'].includes(currentUser.role) && (
               <div className={`absolute top-2 right-2 flex gap-1 transition-opacity bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-1 z-10 ${folder.isLocked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                 <button 
                   onClick={(e) => handleToggleLock(folder, e)}
                   className={`p-1 rounded hover:bg-amber-50 ${folder.isLocked ? 'text-amber-600' : 'text-slate-400 hover:text-amber-600'}`}
                   title={folder.isLocked ? "Unlock Folder" : "Lock Folder"}
                 >
                   {folder.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                 </button>
                 <button 
                   onClick={(e) => handleDeleteFolder(folder, e)}
                   className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                   title="Delete Folder"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-base text-left">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 text-slate-700 dark:text-slate-300 border-b-2 border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 sm:px-8 py-4 font-bold text-lg sticky left-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 z-10">Name</th>
              <th className="px-8 py-4 font-bold text-lg hidden md:table-cell">Type</th>
              <th className="px-8 py-4 font-bold text-lg hidden md:table-cell">Uploaded By</th>
              <th className="px-8 py-4 font-bold text-lg hidden md:table-cell">Date</th>
              <th className="px-4 sm:px-8 py-4 font-bold text-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading documents...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  No documents found in this folder.
                </td>
              </tr>
            ) : (
              documents.map(doc => (
                <tr key={doc.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-slate-50 dark:hover:from-blue-900/20 dark:hover:to-slate-800/60 group transition-all duration-200">
                  <td className="px-4 sm:px-8 py-5 font-semibold text-base sticky left-0 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="truncate max-w-[180px] md:max-w-[350px] text-slate-900 dark:text-white" title={doc.name}>{doc.name}</span>
                    </div>
                    {/* Mobile-only details */}
                    <div className="md:hidden text-xs text-slate-500 mt-1 pl-6">
                      {new Date(doc.createdAt).toLocaleDateString()} • {doc.uploader?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-500 hidden md:table-cell">{doc.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</td>
                  <td className="px-8 py-5 text-slate-500 hidden md:table-cell">{doc.uploader?.name || 'Unknown'}</td>
                  <td className="px-8 py-5 text-slate-500 hidden md:table-cell">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 sm:px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <a 
                        href={`/api/documents/download?id=${doc.id}`} 
                        target="_blank"
                        className="p-3 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"
                        title="View/Download"
                      >
                        <Eye className="w-5 h-5" />
                      </a>
                      <button 
                        onClick={() => handleRename(doc)}
                        className="p-3 hover:bg-amber-50 text-amber-600 rounded-xl transition-colors"
                        title="Rename"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-3 hover:bg-red-50 text-red-600 rounded-xl transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
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
        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <button 
            disabled={page <= 1}
            onClick={() => fetchDocuments(page - 1)}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-900 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-300">Page {page} of {totalPages}</span>
          <button 
            disabled={page >= totalPages}
            onClick={() => fetchDocuments(page + 1)}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-900 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  </div>
);
}