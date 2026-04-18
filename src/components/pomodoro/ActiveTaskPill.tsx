import { Target, X } from 'lucide-react'
import type { ActiveTaskLink } from '../../context/PomodoroContext'

interface Props {
  activeTask: ActiveTaskLink | null
  onClear: () => void
}

export function ActiveTaskPill({ activeTask, onClear }: Props) {
  if (!activeTask) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-dashed border-white/10 bg-white/2 text-white/35 text-xs">
        <Target size={14} />
        <span>Vincule uma tarefa em "Meu Dia" para contar pomodoros</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-500/25 bg-rose-500/8 text-rose-100">
      <Target size={14} className="text-rose-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-rose-300/70 font-semibold leading-none">
          Focando em
        </div>
        <div className="text-sm font-medium truncate mt-0.5">{activeTask.title}</div>
      </div>
      <button
        onClick={onClear}
        aria-label="Desvincular tarefa"
        className="p-1 rounded-lg text-rose-300/60 hover:text-rose-200 hover:bg-rose-500/15 transition-all shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
