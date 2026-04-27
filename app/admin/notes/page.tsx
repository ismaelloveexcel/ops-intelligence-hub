'use client'

import { useState, useEffect, useRef } from 'react'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import Link from 'next/link'
import { ChevronLeft, Plus, Loader2, Lock, Unlock, Trash2, Save, X, ShieldAlert, ArrowLeft } from 'lucide-react'

interface Note {
  id: string
  title: string
  content_md: string | null
  kpi_area: string | null
  is_private: boolean
  created_at: string
  updated_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | 'new' | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [saving, setSaving] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/admin/notes')
      .then((r) => r.json())
      .then((d) => { setNotes(d.notes ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function openNote(note: Note) {
    setActiveId(note.id)
    setTitle(note.title)
    setContent(note.content_md ?? '')
    setIsPrivate(note.is_private)
  }

  function newNote() {
    setActiveId('new')
    setTitle('')
    setContent('')
    setIsPrivate(true)
  }

  async function saveNote() {
    if (!title.trim()) return
    setSaving(true)

    if (activeId === 'new') {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content_md: content || null, is_private: isPrivate }),
      })
      const d = await res.json()
      if (d.note) { setNotes((n) => [d.note, ...n]); setActiveId(d.note.id) }
    } else if (activeId) {
      const res = await fetch(`/api/admin/notes/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content_md: content || null, is_private: isPrivate }),
      })
      const d = await res.json()
      if (d.note) setNotes((n) => n.map((x) => (x.id === activeId ? d.note : x)))
    }
    setSaving(false)
  }

  function scheduleAutoSave() {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => { saveNote() }, 1500)
  }

  async function deleteNote(id: string) {
    if (!confirm('Delete this note?')) return
    await fetch(`/api/admin/notes/${id}`, { method: 'DELETE' })
    setNotes((n) => n.filter((x) => x.id !== id))
    if (activeId === id) { setActiveId(null); setTitle(''); setContent('') }
  }

  const isEditing = activeId !== null

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-5xl mx-auto">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-white/40 text-sm mb-8 hover:text-white/70 transition-colors">
        <ChevronLeft size={16} />Dashboard
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1"><ImpactDot /><p className="mono-label">Notes</p></div>
          <h1 className="text-2xl font-bold tracking-tight">My notes</h1>
          <p className="text-white/40 text-sm mt-1">Your personal scratchpad — notes here stay private unless you decide otherwise.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
            <ShieldAlert size={13} />Admin only
          </div>
          <button onClick={newNote} className="btn-primary text-sm py-2">
            <Plus size={14} />New note
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Note list */}
        <div className="sm:col-span-1">
          {loading ? (
            <div className="flex items-center gap-3 text-white/40"><Loader2 size={14} className="animate-spin" />Loading…</div>
          ) : notes.length === 0 ? (
            <GlassCard className="p-4">
              <p className="text-white/30 text-sm">Nothing here yet</p>
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => openNote(note)}
                  onKeyDown={(e) => e.key === 'Enter' && openNote(note)}
                >
                  <GlassCard
                    className={`p-3 hover:border-gold/20 transition-colors ${activeId === note.id ? 'border-gold/25 bg-gold/[0.05]' : ''}`}
                  >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-sm truncate">{note.title}</p>
                      {note.content_md && (
                        <p className="text-white/25 text-xs mt-0.5 truncate">{note.content_md.slice(0, 60)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {note.is_private ? <Lock size={10} className="text-white/20" /> : <Unlock size={10} className="text-gold/40" />}
                      <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }} className="text-white/15 hover:text-danger p-0.5">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="sm:col-span-2">
          {isEditing ? (
            <GlassCard className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <input
                  className="input text-base font-medium flex-1"
                  placeholder="Note title"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); scheduleAutoSave() }}
                />
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setIsPrivate((v) => !v)}
                    className={`p-2 rounded border transition-colors ${isPrivate ? 'border-white/10 text-white/30' : 'border-gold/30 text-gold'}`}
                    title={isPrivate ? 'Private' : 'Shared'}
                  >
                    {isPrivate ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <button onClick={saveNote} disabled={saving} className="btn-primary text-sm py-1.5">
                    {saving ? <><Loader2 size={13} className="animate-spin" />Saving</> : <><Save size={13} />Save</>}
                  </button>
                  <button onClick={() => setActiveId(null)} className="p-2 text-white/25 hover:text-white/50">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <textarea
                className="input w-full font-mono text-sm"
                placeholder="Write your note here… (markdown supported)"
                value={content}
                onChange={(e) => { setContent(e.target.value); scheduleAutoSave() }}
                rows={16}
              />
              <p className="text-white/20 text-xs mt-2">
                {isPrivate ? '🔒 Private — only you can see this' : '👁 Not private — can be linked to SOP drafts'}
              </p>
            </GlassCard>
          ) : (
            <GlassCard className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <p className="text-white/25 text-sm">
                Select a note to edit, or create a new one
              </p>
              <button onClick={newNote} className="btn-secondary text-sm mt-4">
                <Plus size={14} />New note
              </button>
            </GlassCard>
          )}
        </div>
      </div>
    </main>
  )
}
