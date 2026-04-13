import { useState, type FormEvent } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import type { TaskPriority } from '../types'

interface Props {
  onAdd: (title: string, description?: string, priority?: TaskPriority) => void
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
]

export function AddTaskForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title, description || undefined, priority)
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
      </button>
    )
  }

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
        placeholder="Nome da tarefa..."
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-indigo-400/60 focus:bg-white/8 transition-all"
      />

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
          disabled={!title.trim()}
          className="px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Adicionar
        </button>
      </div>
    </form>
  )
}
