import { useEffect, useState, type FormEvent } from 'react'
import { Plus, ChevronDown, Sparkles } from 'lucide-react'
import type { TaskPriority } from '../types'
import { parseQuickAdd } from '../utils/quickAdd'

interface Props {
  dayId?: string
  onAdd: (title: string, description?: string, priority?: TaskPriority) => void
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
]

export function AddTaskForm({ dayId, onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  // Listen for external "open me" trigger (keyboard shortcut N)
  useEffect(() => {
    if (!dayId) return
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { dayId: string } | undefined
      if (detail?.dayId === dayId) setOpen(true)
    }
    window.addEventListener('organizer:add-task', onOpen)
    return () => window.removeEventListener('organizer:add-task', onOpen)
  }, [dayId])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseQuickAdd(title, priority)
    if (!parsed.title) return
    onAdd(parsed.title, description || undefined, parsed.priority)
    setTitle('')
    setDescription('')
    setPriority('medium')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 hover:bg-white/3 transition-all duration-200 text-sm"
      >
        <Plus size={15} />
        Adicionar tarefa
        <span className="ml-auto font-mono text-[10px] text-white/25 bg-white/5 border border-white/8 rounded px-1 py-0.5">N</span>
      </button>
    )
  }

  const parsed = parseQuickAdd(title, priority)
  const detected = parsed.title !== title.trim()

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3"
    >
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nome da tarefa... (dica: !alta, !baixa)"
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-indigo-400/60 focus:bg-white/8 transition-all"
      />

      {detected && (
        <div className="flex items-center gap-1.5 text-[11px] text-indigo-300">
          <Sparkles size={11} />
          Prioridade detectada: <span className="font-semibold capitalize">{parsed.priority === 'high' ? 'alta' : parsed.priority === 'low' ? 'baixa' : 'média'}</span>
        </div>
      )}

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição (opcional)"
        rows={2}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-indigo-400/60 focus:bg-white/8 transition-all resize-none"
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-8 text-sm text-white/70 outline-none focus:border-indigo-400/60 transition-all cursor-pointer"
          >
            {priorityOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-gray-900 text-white">
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={!parsed.title.trim()}
          className="px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Adicionar
        </button>
      </div>
    </form>
  )
}
