import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Exercise } from '../../types/workout'
import { ExerciseItem } from './ExerciseItem'

interface Props {
  exercise: Exercise
  onToggle: () => void
  onRemove: () => void
}

export function SortableExerciseItem({ exercise, onToggle, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <button
        {...attributes}
        {...listeners}
        className="p-1 rounded text-white/15 hover:text-white/40 cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none"
        tabIndex={-1}
        aria-label="Arrastar exercício"
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <ExerciseItem exercise={exercise} onToggle={onToggle} onRemove={onRemove} />
      </div>
    </div>
  )
}
