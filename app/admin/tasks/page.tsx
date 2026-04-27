'use client'

import { useState, useEffect } from 'react'
import GlassCard from '@/components/GlassCard'
import ImpactDot from '@/components/ImpactDot'
import Link from 'next/link'
import { ChevronLeft, Plus, Loader2, X, ShieldAlert, Check, ChevronRight } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  kpi_area: string | null
  project_id: string | null
  source: 'self' | 'management' | 'ad_hoc' | 'cross_functional'
  created_at: string
  completed_at: string | null
}

const STATUS_COLS: Array<{ key: Task['status']; label: string; next: Task['status'] | null }> = [
  { key: 'todo', label: 'To Do', next: 'in_progress' },
  { key: 'in_progress', label: 'In Progress', next: 'done' },
  { key: 'done', label: 'Done', next: null },
]

const SOURCE_LABELS: Record<Task['source'], string> = {
  self: 'Self',
  management: 'From management',
  ad_hoc: 'Ad hoc',
  cross_functional: 'Cross-functional',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSource, setNewSource] = useState<Task['source']>('self')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch('/api/admin/tasks')
      .then((r) => r.json())
      .then((d) => { setTasks(d.tasks ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function addTask() {
    if (!newTitle.trim()) return
    setAdding(true)
    const res = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), source: newSource }),
    })
    const d = await res.json()
    if (d.task) { setTasks((t) => [d.task, ...t]); setNewTitle(''); setShowAdd(false) }
    setAdding(false)
  }

  async function moveTask(task: Task, newStatus: Task['status']) {
    const res = await fetch(`/api/admin/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const d = await res.json()
    if (d.task) setTasks((t) => t.map((x) => (x.id === task.id ? d.task : x)))
  }

  async function deleteTask(id: string) {
    await fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' })
    setTasks((t) => t.filter((x) => x.id !== id))
  }

  return (
    <main className="min-h-screen px-4 pt-10 pb-10 max-w-5xl mx-auto">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-white/40 text-sm mb-8 hover:text-white/70 transition-colors">
        <ChevronLeft size={16} />Dashboard
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1"><ImpactDot /><p className="mono-label">Tasks</p></div>
          <h1 className="text-2xl font-bold tracking-tight">What I&apos;m working on</h1>
          <p className="text-white/40 text-sm mt-1">Personal task log — never in reports unless promoted.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/25 bg-gold/[0.08] text-gold text-xs font-mono">
            <ShieldAlert size={13} />Admin only
          </div>
          <button onClick={() => setShowAdd((v) => !v)} className="btn-primary text-sm py-2">
            <Plus size={14} />{showAdd ? 'Cancel' : 'Add task'}
          </button>
        </div>
      </div>

      {showAdd && (
        <GlassCard className="p-4 mb-6">
          <div className="flex flex-col gap-3">
            <input className="input" placeholder="What are you working on?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && addTask()} />
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(SOURCE_LABELS) as Task['source'][]).map((s) => (
                <button key={s} type="button" onClick={() => setNewSource(s)} className={`text-xs px-3 py-1.5 rounded border transition-colors ${newSource === s ? 'border-gold/40 bg-gold/10 text-gold' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                  {SOURCE_LABELS[s]}
                </button>
              ))}
            </div>
            <button onClick={addTask} disabled={adding || !newTitle.trim()} className="btn-primary text-sm self-start">
              {adding ? <><Loader2 size={14} className="animate-spin" />Adding…</> : <><Check size={14} />Add</>}
            </button>
          </div>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-white/40"><Loader2 size={16} className="animate-spin" />Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATUS_COLS.map(({ key, label, next }) => {
            const col = tasks.filter((t) => t.status === key)
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <p className="mono-label">{label}</p>
                  <span className="text-white/25 text-xs font-mono">({col.length})</span>
                </div>
                {col.length === 0 && key === 'todo' ? (
                  <GlassCard className="p-4">
                    <p className="text-white/25 text-sm">Nothing on your list yet — add something</p>
                  </GlassCard>
                ) : (
                  <div className="flex flex-col gap-2">
                    {col.map((task) => (
                      <GlassCard key={task.id} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm flex-1 ${key === 'done' ? 'text-white/30 line-through' : 'text-white/70'}`}>
                            {task.title}
                          </p>
                          <button onClick={() => deleteTask(task.id)} className="text-white/15 hover:text-danger p-0.5 flex-shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-white/25 font-mono">{SOURCE_LABELS[task.source]}</span>
                          {next && (
                            <button onClick={() => moveTask(task, next)} className="text-[10px] text-white/30 hover:text-gold font-mono flex items-center gap-0.5 transition-colors">
                              {next.replace('_', ' ')}<ChevronRight size={10} />
                            </button>
                          )}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
