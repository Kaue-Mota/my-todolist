import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, Trash2, ChevronDown, ChevronUp, Flame, Repeat, MoreVertical, ArrowRight, Play } from 'lucide-react'
import type { Task } from '../types'
import { PriorityBadge } from './PriorityBadge'
import { usePomodoroContext } from '../context/PomodoroContext'

interface DayTarget { id: string; date: string }

interface Props {
  task: Task
  /** If omitted, no move menu / pomodoro menu is shown (used in DragOverlay). */
  dayTargets?: DayTarget[]
  onToggle: () => void
  onRemove: () => void
  onToggleRecurring?: () => void
  onMoveTo?: (dayId: string) => void
  /** If provided, this allows linking the task to Pomodoro (needs day context). */
  dayId?: string
}

export function TaskItem({ task, dayTargets, onToggle, onRemove, onToggleRecurring, onMoveTo, dayId }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pomodoro = usePomodoroContext()
  const isActivePomodoro = pomodoro.activeTask?.taskId === task.id

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    setTimeout(() => document.addEventListener('click', close), 0)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  function handlePomodoroLink() {
    if (!dayId) return
    if (isActivePomodoro) pomodoro.setActiveTask(null)
    else pomodoro.setActiveTask({ dayId, taskId: task.id, title: task.title })
    setMenuOpen(false)
  }

  const showMenu = Boolean(onToggleRecurring || (onMoveTo && dayTargets && dayTargets.length > 0))

  return (
    <div
      className={`group relative flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-200
        ${task.completed
          ? 'bg-white/3 border-white/5 opacity-60'
          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
        }
        ${isActivePomodoro ? 'ring-1 ring-rose-400/60' : ''}`}
    >
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

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium leading-snug transition-all duration-200
              ${task.completed ? 'line-through text-white/30' : 'text-white/85'}`}
          >
            {task.title}
          </span>
          <PriorityBadge priority={task.priority} />
          {task.recurring && (
            <span title="Tarefa recorrente — copiada automaticamente para novos dias" className="inline-flex items-center gap-0.5 text-[10px] text-violet-300 bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded-full">
              <Repeat size={9} />
              {task.recurring === 'daily' ? 'diária' : 'semanal'}
            </span>
          )}
          {(task.pomodoros ?? 0) > 0 && (
            <span title={`${task.pomodoros} pomodoro(s)`} className="inline-flex items-center gap-0.5 text-[10px] text-rose-300 bg-rose-500/15 border border-rose-500/25 px-1.5 py-0.5 rounded-full">
              <Flame size={9} />
              {task.pomodoros}
            </span>
          )}
          {isActivePomodoro && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-300 bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.5 rounded-full font-semibold animate-pulse-ring">
              <Play size={9} />
              em foco
            </span>
          )}
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

      <div className="shrink-0 flex items-start gap-0.5">
        {showMenu && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="opacity-0 group-hover:opacity-100 mt-0.5 p-1 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/5 transition-all duration-150"
              aria-label="Mais ações"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-6 z-20 w-52 bg-gray-900 border border-white/10 rounded-xl shadow-2xl p-1 space-y-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {dayId && (
                  <button
                    onClick={handlePomodoroLink}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors
                      ${isActivePomodoro ? 'bg-rose-500/15 text-rose-300' : 'text-white/75 hover:bg-white/5 hover:text-white/95'}`}
                  >
                    <Flame size={13} className="text-rose-400" />
                    {isActivePomodoro ? 'Desvincular Pomodoro' : 'Focar nesta (Pomodoro)'}
                  </button>
                )}
                {onToggleRecurring && (
                  <button
                    onClick={() => { onToggleRecurring(); setMenuOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors
                      ${task.recurring ? 'bg-violet-500/15 text-violet-300' : 'text-white/75 hover:bg-white/5 hover:text-white/95'}`}
                  >
                    <Repeat size={13} className="text-violet-400" />
                    {task.recurring ? 'Remover recorrência' : 'Tornar recorrente (diária)'}
                  </button>
                )}
                {onMoveTo && dayTargets && dayTargets.length > 0 && (
                  <>
                    <div className="h-px bg-white/5 my-1" />
                    <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30 flex items-center gap-1">
                      <ArrowRight size={9} /> Mover para
                    </div>
                    <div className="max-h-48 overflow-y-auto scrollbar-thin">
                      {dayTargets.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => { onMoveTo(d.id); setMenuOpen(false) }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/5 hover:text-white/95 transition-colors capitalize"
                        >
                          {format(parseISO(d.date), "EEE d/MM", { locale: ptBR })}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 mt-0.5 p-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
          aria-label="Remover tarefa"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
