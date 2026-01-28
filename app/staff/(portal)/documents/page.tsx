"use client"

import React, { useEffect, useRef, useState } from 'react'

export default function DocumentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [currentFolder, setCurrentFolder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = localStorage.getItem('kapilla_user')
    if (u) setCurrentUser(JSON.parse(u))
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchDocs(), fetchFolders()])
    setLoading(false)
  }

  const fetchFolders = async () => {
    const res = await fetch(`/api/documents/folders?ts=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) setFolders(await res.json())
  }

  const fetchDocs = async () => {
    try {
      const res = await fetch(`/api/documents?ts=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setDocs(data)
      }
    } catch {
      // ignore
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim() || !currentUser) return
    const res = await fetch('/api/documents/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFolderName, userId: currentUser.id })
    })
    if (res.ok) {
      setNewFolderName('')
      setShowCreateFolder(false)
      fetchFolders()
      fetchDocs() // Refresh docs to reflect auto-assignment
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err?.error || 'Failed to create folder')
    }
  }

  const compressAndUpload = (file: File) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = e => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const maxW = 900
        const scale = maxW / img.width
        canvas.width = maxW
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        const base64 = canvas.toDataURL('image/jpeg', 0.6)
        await uploadDoc(base64, file.name, 'image/jpeg')
      }
    }
  }

  const uploadDoc = async (data: string, name: string, mimeType: string) => {
    if (!currentUser) return
    setUploading(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploaderId: currentUser.id, name, data, mimeType }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err?.error || 'Failed to save document')
        return
      }
      fetchDocs()
      fetchFolders()
    } finally {
      setUploading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      compressAndUpload(f)
    } catch {
      const reader = new FileReader()
      reader.readAsDataURL(f)
      reader.onload = async () => {
        await uploadDoc(reader.result as string, f.name, f.type || 'image/jpeg')
      }
    }
  }

  const startRename = (id: string, name: string) => {
    setRenamingId(id)
    setRenameValue(name)
  }

  const saveRename = async () => {
    if (!renamingId || !renameValue.trim()) return
    const res = await fetch('/api/documents/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: renamingId, name: renameValue.trim() }),
    })
    if (res.ok) {
      setRenamingId(null)
      setRenameValue('')
      fetchDocs()
      fetchFolders()
    }
  }

  const canDelete = (doc: any) => {
    if (!currentUser) return false
    if (currentUser.role === 'ADMIN') return true
    const owner = doc.uploaderId === currentUser.id
    const withinOneMinute = Date.now() - new Date(doc.createdAt).getTime() < 60000
    return owner && withinOneMinute
  }

  const deleteDoc = async (id: string) => {
    if (!currentUser) return
    const res = await fetch(`/api/documents/delete?id=${id}&userId=${currentUser.id}`, { method: 'DELETE' })
    if (res.ok) {
      setDocs(docs.filter(d => d.id !== id))
      fetchFolders()
    }
  }

  const filteredDocs = currentFolder 
    ? docs.filter(d => d.folderId === currentFolder.id) 
    : docs.filter(d => !d.folderId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentFolder && (
            <button onClick={() => setCurrentFolder(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
              <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {currentFolder ? currentFolder.name : 'Documents'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {currentFolder ? 'Viewing folder contents' : 'Scan and share documents to the team.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!currentFolder && currentUser && ['ADMIN', 'OPERATION_MANAGER'].includes(currentUser.role) && (
            <button
              onClick={() => setShowCreateFolder(true)}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Create File
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            title="Refresh"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Scan Document'}
          </button>
        </div>
      </div>

      {!currentFolder && folders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setCurrentFolder(folder)}
              className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
              </svg>
              <span className="font-medium text-slate-700 dark:text-slate-200">{folder.name}</span>
              <span className="text-xs text-slate-500">{folder._count?.documents || 0} docs</span>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Uploaded By</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredDocs.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No documents in this location</td></tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      {renamingId === doc.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                          />
                          <button onClick={saveRename} className="px-3 py-2 bg-blue-600 text-white rounded-lg">Save</button>
                          <button onClick={() => setRenamingId(null)} className="px-3 py-2 border rounded-lg">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <a href="#" onClick={(e) => { e.preventDefault(); setPreviewDoc(doc); }} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            {doc.name}
                          </a>
                          <button onClick={() => startRename(doc.id, doc.name)} className="text-slate-500 hover:text-slate-700">Rename</button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-200">
                      {doc.uploader?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(doc.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => setPreviewDoc(doc)} className="px-3 py-2 border rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600">Preview</button>
                      {canDelete(doc) && (
                        <button onClick={() => deleteDoc(doc.id)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Create New File</h3>
            <input
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="File Name (e.g. INVOICES)"
              className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateFolder(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={createFolder} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewDoc(null)}>
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate pr-4">{previewDoc.name}</h3>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 dark:bg-slate-950/50">
              <img 
                src={`/api/documents/download?id=${previewDoc.id}`} 
                alt={previewDoc.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg" 
              />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
              <a 
                href={`/api/documents/download?id=${previewDoc.id}`} 
                download
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
