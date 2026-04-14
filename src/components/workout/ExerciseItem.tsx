import { Check, Trash2 } from 'lucide-react'
import type { Exercise } from '../../types/workout'

interface Props {
  exercise: Exercise
  onToggle: () => void
  onRemove: () => void
}

export function ExerciseItem({ exercise, onToggle, onRemove }: Props) {
  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
        ${exercise.completed
          ? 'bg-white/3 border-white/5 opacity-55'
          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
          ${exercise.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-white/30 hover:border-emerald-400'
          }`}
        aria-label={exercise.completed ? 'Marcar como pendente' : 'Marcar como concluído'}
      >
        {exercise.completed && <Check size={11} strokeWidth={3} className="text-white" />}
      </button>

      {/* Name */}
      <span
        className={`flex-1 text-sm font-medium transition-all duration-200
          ${exercise.completed ? 'line-through text-white/30' : 'text-white/85'}`}
      >
        {exercise.name}
      </span>

      {/* Sets × Reps badge */}
      <span
        className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-200
          ${exercise.completed
            ? 'bg-white/5 text-white/20'
            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
          }`}
      >
        {exercise.setsReps}
      </span>

      {/* Delete */}
      <button
        onClick={onRemove}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
        aria-label="Remover exercício"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
