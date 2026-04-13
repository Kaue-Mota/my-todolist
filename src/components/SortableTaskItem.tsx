import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Task } from '../types'
import { TaskItem } from './TaskItem'

interface Props {
  task: Task
  onToggle: () => void
  onRemove: () => void
}

export function SortableTaskItem({ task, onToggle, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1">
      <button
        {...attributes}
        {...listeners}
        className="mt-3 p-1 rounded text-white/15 hover:text-white/40 cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none"
        tabIndex={-1}
        aria-label="Arrastar tarefa"
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <TaskItem task={task} onToggle={onToggle} onRemove={onRemove} />
      </div>
    </div>
  )
}
