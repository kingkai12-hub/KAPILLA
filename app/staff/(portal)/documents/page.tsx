\"use client\"

import React, { useEffect, useRef, useState } from 'react'

export default function DocumentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = localStorage.getItem('kapilla_user')
    if (u) setCurrentUser(JSON.parse(u))
    fetchDocs()
  }, [])

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/documents')
      if (res.ok) {
        const data = await res.json()
        setDocs(data)
      }
    } finally {
      setLoading(false)
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
      if (res.ok) {
        await fetchDocs()
      }
    } finally {
      setUploading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    compressAndUpload(f)
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
    }
  }

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/api/documents/download?id=${id}`
    navigator.clipboard.writeText(url)
  }

  return (
    <div className=\"space-y-6\">
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-bold text-slate-900 dark:text-white\">Documents</h1>
          <p className=\"text-slate-500 dark:text-slate-400 mt-1\">Scan and share documents to the team.</p>
        </div>
        <div className=\"flex items-center gap-2\">
          <input
            ref={fileInputRef}
            type=\"file\"
            accept=\"image/*\"
            capture=\"environment\"
            onChange={onFileChange}
            className=\"hidden\"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50\"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Scan Document'}
          </button>
        </div>
      </div>

      <div className=\"bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden\">
        <div className=\"overflow-x-auto\">
          <table className=\"min-w-full divide-y divide-slate-100 dark:divide-slate-700\">
            <thead className=\"bg-slate-50 dark:bg-slate-900/50\">
              <tr>
                <th className=\"px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase\">Name</th>
                <th className=\"px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase\">Uploaded By</th>
                <th className=\"px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase\">Date</th>
                <th className=\"px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase\">Actions</th>
              </tr>
            </thead>
            <tbody className=\"divide-y divide-slate-100 dark:divide-slate-700\">
              {loading ? (
                <tr><td colSpan={4} className=\"px-6 py-8 text-center text-slate-500\">Loading...</td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={4} className=\"px-6 py-8 text-center text-slate-500\">No documents</td></tr>
              ) : (
                docs.map(doc => (
                  <tr key={doc.id} className=\"hover:bg-slate-50 dark:hover:bg-slate-700/50\">
                    <td className=\"px-6 py-4\">
                      {renamingId === doc.id ? (
                        <div className=\"flex items-center gap-2\">
                          <input
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            className=\"px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600\"
                          />
                          <button onClick={saveRename} className=\"px-3 py-2 bg-blue-600 text-white rounded-lg\">Save</button>
                          <button onClick={() => setRenamingId(null)} className=\"px-3 py-2 border rounded-lg\">Cancel</button>
                        </div>
                      ) : (
                        <div className=\"flex items-center gap-2\">
                          <a href={`/api/documents/download?id=${doc.id}`} target=\"_blank\" className=\"font-medium text-blue-600 dark:text-blue-400 hover:underline\">
                            {doc.name}
                          </a>
                          <button onClick={() => startRename(doc.id, doc.name)} className=\"text-slate-500 hover:text-slate-700\">Rename</button>
                        </div>
                      )}
                    </td>
                    <td className=\"px-6 py-4 text-sm text-slate-700 dark:text-slate-200\">
                      {doc.uploader?.name || 'Unknown'}
                    </td>
                    <td className=\"px-6 py-4 text-sm text-slate-500\">
                      {new Date(doc.createdAt).toLocaleString()}
                    </td>
                    <td className=\"px-6 py-4 text-right flex justify-end gap-2\">
                      <button onClick={() => copyLink(doc.id)} className=\"px-3 py-2 border rounded-lg\">Copy Link</button>
                      {canDelete(doc) && (
                        <button onClick={() => deleteDoc(doc.id)} className=\"px-3 py-2 bg-red-600 text-white rounded-lg\">Delete</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
