import { useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, CornerDownLeft, X, CheckCircle2, Circle, Dumbbell, ListTodo } from 'lucide-react'
import type { Day } from '../types'
import { isTask } from '../types'
import type { WorkoutDay } from '../types/workout'
import { isExercise } from '../types/workout'

interface SearchResult {
  id: string
  kind: 'task' | 'exercise'
  dayId: string
  dayDate: string
  title: string
  subtitle?: string
  completed: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  days: Day[]
  workoutDays: WorkoutDay[]
  onNavigateTask: (dayId: string, taskId: string) => void
  onNavigateExercise: (dayId: string, exerciseId: string) => void
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function buildIndex(days: Day[], workouts: WorkoutDay[]): SearchResult[] {
  const out: SearchResult[] = []
  for (const d of days) {
    for (const item of d.tasks) {
      if (!isTask(item)) continue
      out.push({
        id: item.id,
        kind: 'task',
        dayId: d.id,
        dayDate: d.date,
        title: item.title,
        subtitle: item.description,
        completed: item.completed,
      })
    }
  }
  for (const d of workouts) {
    for (const item of d.exercises) {
      if (!isExercise(item)) continue
      out.push({
        id: item.id,
        kind: 'exercise',
        dayId: d.id,
        dayDate: d.date,
        title: item.name,
        subtitle: item.setsReps,
        completed: item.completed,
      })
    }
  }
  return out
}

function score(item: SearchResult, query: string): number {
  if (!query) return 0
  const q = norm(query)
  const t = norm(item.title)
  const s = norm(item.subtitle ?? '')
  if (t.startsWith(q)) return 1000
  if (t.includes(q)) return 500
  if (s.includes(q)) return 100
  // loose character match
  let j = 0
  for (let i = 0; i < t.length && j < q.length; i++) {
    if (t[i] === q[j]) j++
  }
  return j === q.length ? 10 : -1
}

export function SearchPalette({ open, onClose, days, workoutDays, onNavigateTask, onNavigateExercise }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const index = useMemo(() => buildIndex(days, workoutDays), [days, workoutDays])

  const results = useMemo(() => {
    if (!query.trim()) {
      return index
        .filter((r) => !r.completed)
        .slice(0, 20)
    }
    return index
      .map((r) => ({ r, s: score(r, query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 25)
      .map((x) => x.r)
  }, [index, query])

  useEffect(() => { setSelected(0) }, [query])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((i) => Math.min(results.length - 1, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((i) => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = results[selected]
        if (item) {
          if (item.kind === 'task') onNavigateTask(item.dayId, item.id)
          else onNavigateExercise(item.dayId, item.id)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, selected, onClose, onNavigateTask, onNavigateExercise])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-xl bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
          <Search size={16} className="text-white/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tarefas, exercícios..."
            className="flex-1 bg-transparent outline-none text-sm text-white/90 placeholder-white/30"
          />
          <kbd className="text-[10px] font-mono text-white/35 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
          <button onClick={onClose} className="p-1 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5">
            <X size={14} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto scrollbar-thin">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-white/30">
              {query.trim() ? 'Nada encontrado' : 'Nenhuma tarefa ou exercício ainda'}
            </div>
          ) : (
            <ul>
              {results.map((r, i) => {
                const Icon = r.kind === 'exercise' ? Dumbbell : ListTodo
                const Status = r.completed ? CheckCircle2 : Circle
                return (
                  <li key={`${r.kind}-${r.id}`}>
                    <button
                      onClick={() => {
                        if (r.kind === 'task') onNavigateTask(r.dayId, r.id)
                        else onNavigateExercise(r.dayId, r.id)
                        onClose()
                      }}
                      onMouseEnter={() => setSelected(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                        ${i === selected ? 'bg-indigo-500/15 text-white' : 'text-white/70 hover:bg-white/4'}`}
                    >
                      <Status size={14} className={r.completed ? 'text-emerald-400' : 'text-white/30'} />
                      <Icon size={14} className="text-white/40 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate ${r.completed ? 'line-through text-white/40' : 'text-white/90'}`}>
                          {r.title}
                        </div>
                        {r.subtitle && (
                          <div className="text-[11px] text-white/35 truncate">{r.subtitle}</div>
                        )}
                      </div>
                      <div className="shrink-0 text-[11px] text-white/30">
                        {format(parseISO(r.dayDate), "EEE d/MM", { locale: ptBR })}
                      </div>
                      {i === selected && <CornerDownLeft size={12} className="text-white/40 shrink-0" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/8 text-[10px] text-white/30">
          <span className="flex items-center gap-1"><kbd className="font-mono bg-white/5 border border-white/10 rounded px-1">↑↓</kbd> navegar</span>
          <span className="flex items-center gap-1"><kbd className="font-mono bg-white/5 border border-white/10 rounded px-1">↵</kbd> abrir</span>
        </div>
      </div>
    </div>
  )
}
