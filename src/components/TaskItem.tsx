import { useState } from 'react'
import { Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { Task } from '../types'
import { PriorityBadge } from './PriorityBadge'

interface Props {
  task: Task
  onToggle: () => void
  onRemove: () => void
}

export function TaskItem({ task, onToggle, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-200
        ${task.completed
          ? 'bg-white/3 border-white/5 opacity-60'
          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
          ${task.completed
            ? 'bg-indigo-500 border-indigo-500'
            : 'border-white/30 hover:border-indigo-400'
          }`}
        aria-label={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
      >
        {task.completed && <Check size={11} strokeWidth={3} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium leading-snug transition-all duration-200
              ${task.completed ? 'line-through text-white/30' : 'text-white/85'}`}
          >
            {task.title}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>

        {task.description && (
          <div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 mt-1 text-[11px] text-white/35 hover:text-white/55 transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
            </button>
            {expanded && (
              <p className="mt-1.5 text-xs text-white/45 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={onRemove}
        className="shrink-0 opacity-0 group-hover:opacity-100 mt-0.5 p-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
        aria-label="Remover tarefa"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
