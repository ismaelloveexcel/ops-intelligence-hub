'use client'

import { useState, useEffect } from 'react'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import Link from 'next/link'
import { ChevronLeft, Plus, Loader2, Eye, EyeOff, Archive, X, ShieldAlert, Pencil, Check } from 'lucide-react'
import { KPI_AREA_LABELS, KpiArea } from '@/lib/types'

interface Project {
  id: string
  title: string
  description: string | null
  status: 'private' | 'active' | 'completed' | 'archived'
  visibility: 'private' | 'public'
  kpi_area: KpiArea | null
  notes: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  private: 'text-white/40 border-white/[0.08]',
  active: 'text-gold border-gold/30',
  completed: 'text-success border-success/30',
  archived: 'text-white/25 border-white/[0.05]',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Project>>({})

  useEffect(() => {
    fetch('/api/admin/projects')
      .then((r) => r.json())
      .then((d) => { setProjects(d.projects ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function createProject() {
    if (!newTitle.trim()) return
    setCreating(true)
    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || null }),
    })
    const d = await res.json()
    if (d.project) {
      setProjects((p) => [d.project, ...p])
      setNewTitle('')
      setNewDesc('')
      setShowForm(false)
    }
    setCreating(false)
  }

  async function updateProject(id: string, patch: Partial<Project>) {
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const d = await res.json()
    if (d.project) setProjects((p) => p.map((x) => (x.id === id ? d.project : x)))
  }

  async function deleteProject(id: string) {
    if (!confirm('Archive this project?')) return
    await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
    setProjects((p) => p.filter((x) => x.id !== id))
  }

  const visible = projects.filter((p) => p.status !== 'archived')
  const archived = projects.filter((p) => p.status === 'archived')

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-3xl mx-auto">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-white/40 text-sm mb-8 hover:text-white/70 transition-colors">
        <ChevronLeft size={16} />Dashboard
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1"><ImpactDot /><p className="mono-label">Projects</p></div>
          <h1 className="text-2xl font-bold tracking-tight">Your projects</h1>
          <p className="text-white/40 text-sm mt-1">Private projects are invisible everywhere except here.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
            <ShieldAlert size={13} />Admin only
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary text-sm py-2">
            <Plus size={14} />{showForm ? 'Cancel' : 'New'}
          </button>
        </div>
      </div>

      {showForm && (
        <GlassCard className="p-5 mb-6">
          <div className="flex flex-col gap-3">
            <input className="input" placeholder="Project title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
            <textarea className="input" placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} />
            <button onClick={createProject} disabled={creating || !newTitle.trim()} className="btn-primary text-sm self-start">
              {creating ? <><Loader2 size={14} className="animate-spin" />Creating…</> : 'Create project'}
            </button>
          </div>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-white/40"><Loader2 size={16} className="animate-spin" />Loading…</div>
      ) : visible.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <p className="text-white/40 text-sm">Nothing on your list yet — add something</p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((project) => {
            const isEditing = editingId === project.id
            return (
              <GlassCard key={project.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        className="input text-sm mb-2"
                        value={editValues.title ?? project.title}
                        onChange={(e) => setEditValues((v) => ({ ...v, title: e.target.value }))}
                        autoFocus
                      />
                    ) : (
                      <p className="text-white/80 font-medium mb-1">{project.title}</p>
                    )}
                    {project.description && !isEditing && (
                      <p className="text-white/40 text-sm mb-2 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${STATUS_COLORS[project.status]}`}>
                        {project.status}
                      </span>
                      {project.kpi_area && (
                        <span className="text-[10px] text-white/30 font-mono">{KPI_AREA_LABELS[project.kpi_area]}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={async () => {
                            await updateProject(project.id, { title: editValues.title ?? project.title })
                            setEditingId(null)
                          }}
                          className="p-1.5 text-success hover:bg-success/10 rounded"
                        >
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-white/25 hover:bg-white/5 rounded">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(project.id); setEditValues({}) }} className="p-1.5 text-white/25 hover:text-white/60 rounded">
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => updateProject(project.id, { visibility: project.visibility === 'private' ? 'public' : 'private' })}
                          className="p-1.5 text-white/25 hover:text-gold rounded"
                          title={project.visibility === 'private' ? 'Make public' : 'Make private'}
                        >
                          {project.visibility === 'private' ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button onClick={() => deleteProject(project.id)} className="p-1.5 text-white/25 hover:text-danger rounded">
                          <Archive size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <div className="flex gap-2 mt-3">
                    {(['active', 'completed', 'private'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateProject(project.id, { status: s })}
                        className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${project.status === s ? 'border-gold/40 bg-gold/10 text-gold' : 'border-white/[0.08] text-white/25 hover:border-white/20'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </GlassCard>
            )
          })}
        </div>
      )}

      {archived.length > 0 && (
        <details className="mt-8">
          <summary className="text-white/25 text-xs font-mono cursor-pointer hover:text-white/40">
            {archived.length} archived
          </summary>
          <div className="flex flex-col gap-2 mt-3">
            {archived.map((p) => (
              <GlassCard key={p.id} className="px-4 py-3 opacity-40">
                <p className="text-sm">{p.title}</p>
              </GlassCard>
            ))}
          </div>
        </details>
      )}
    </main>
  )
}
