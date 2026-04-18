import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Task } from '../types'
import { TaskItem } from './TaskItem'

interface DayTarget { id: string; date: string }

interface Props {
  task: Task
  dayId: string
  dayTargets: DayTarget[]
  onToggle: () => void
  onRemove: () => void
  onToggleRecurring: () => void
  onMoveTo: (dayId: string) => void
  draggable?: boolean
}

export function SortableTaskItem({
  task, dayId, dayTargets,
  onToggle, onRemove, onToggleRecurring, onMoveTo,
  draggable = true,
}: Props) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id, disabled: !draggable, data: { dayId } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1" id={`task-item-${task.id}`}>
      {draggable ? (
        <button
          {...attributes}
          {...listeners}
          className="mt-3 p-1 rounded text-white/15 hover:text-white/40 cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none"
          tabIndex={-1}
          aria-label="Arrastar tarefa"
        >
          <GripVertical size={14} />
        </button>
      ) : (
        <div className="w-6 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <TaskItem
          task={task}
          dayId={dayId}
          dayTargets={dayTargets}
          onToggle={onToggle}
          onRemove={onRemove}
          onToggleRecurring={onToggleRecurring}
          onMoveTo={onMoveTo}
        />
      </div>
    </div>
  )
}
