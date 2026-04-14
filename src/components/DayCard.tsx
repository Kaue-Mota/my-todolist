import { useState } from 'react'
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Trash2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Eraser,
  ClipboardCopy,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Day, TaskFilter, DayListItem, TaskPriority } from '../types'
import { isDivider, isTask } from '../types'
import { SortableTaskItem } from './SortableTaskItem'
import { SortableDividerItem } from './SortableDividerItem'
import { AddTaskForm } from './AddTaskForm'
import { AddDividerForm } from './AddDividerForm'

interface Props {
  day: Day
  onRemoveDay: () => void
  onAddTask: (title: string, description?: string, priority?: TaskPriority) => void
  onToggleTask: (taskId: string) => void
  onRemoveTask: (taskId: string) => void
  onClearCompleted: () => void
  onReorderTasks: (oldIndex: number, newIndex: number) => void
  onAddDivider: (label: string) => void
  onUpdateDividerLabel: (dividerId: string, label: string) => void
  onRemoveDivider: (dividerId: string) => void
  /** Previous day to copy from, if any */
  copySource?: { id: string; date: string }
  onCopyFromDay?: (sourceDayId: string) => void
}

function getDayStatus(date: string) {
  const parsed = parseISO(date)
  if (isToday(parsed)) return 'today'
  if (isPast(parsed)) return 'past'
  if (isFuture(parsed)) return 'future'
  return 'future'
}

const statusStyles = {
  today: {
    card: 'border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 to-gray-900/60',
    badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    label: 'Hoje',
  },
  past: {
    card: 'border-white/8 bg-gray-900/40',
    badge: 'bg-white/8 text-white/40 border border-white/10',
    label: 'Passado',
  },
  future: {
    card: 'border-violet-500/20 bg-gray-900/50',
    badge: 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
    label: 'Futuro',
  },
}

const filterTabs: { value: TaskFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Todas', icon: null },
  { value: 'pending', label: 'Pendentes', icon: <Circle size={12} /> },
  { value: 'completed', label: 'Concluídas', icon: <CheckCircle2 size={12} /> },
]

function filterItems(items: DayListItem[], filter: TaskFilter): DayListItem[] {
  if (filter === 'all') return items
  // In filtered views, hide dividers and filter by completion
  return items.filter((item) => {
    if (isDivider(item)) return false
    return filter === 'completed' ? item.completed : !item.completed
  })
}

export function DayCard({
  day,
  onRemoveDay,
  onAddTask,
  onToggleTask,
  onRemoveTask,
  onClearCompleted,
  onReorderTasks,
  onAddDivider,
  onUpdateDividerLabel,
  onRemoveDivider,
  copySource,
  onCopyFromDay,
}: Props) {
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [collapsed, setCollapsed] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const status = getDayStatus(day.date)
  const styles = statusStyles[status]
  const parsedDate = parseISO(day.date)

  const tasks = day.tasks.filter(isTask)
  const total = tasks.length
  const done = tasks.filter((t) => t.completed).length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  const visible = filterItems(day.tasks, filter)
  const isDraggable = filter === 'all'

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = day.tasks.findIndex((t) => t.id === active.id)
    const newIndex = day.tasks.findIndex((t) => t.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) onReorderTasks(oldIndex, newIndex)
  }

  return (
    <div className={`rounded-2xl border ${styles.card} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${styles.badge}`}>
              {styles.label}
            </span>
            <h2 className="text-base font-semibold text-white/90 capitalize">
              {format(parsedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h2>
          </div>

          {day.label && (
            <p className="mt-0.5 text-xs text-white/40 font-medium">{day.label}</p>
          )}

          {total > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden max-w-30">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] text-white/35">{done}/{total}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-3">
          {copySource && onCopyFromDay && (
            <button
              onClick={() => onCopyFromDay(copySource.id)}
              title={`Copiar tarefas de ${format(parseISO(copySource.date), "EEE, d/MM", { locale: ptBR })}`}
              className="p-1.5 rounded-lg text-white/25 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-150"
            >
              <ClipboardCopy size={15} />
            </button>
          )}
          {done > 0 && (
            <button
              onClick={onClearCompleted}
              title="Limpar concluídas"
              className="p-1.5 rounded-lg text-white/25 hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-150"
            >
              <Eraser size={15} />
            </button>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-all duration-150"
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
          <button
            onClick={onRemoveDay}
            className="p-1.5 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-5 pb-4 space-y-3">
          {/* Filter Tabs */}
          {total > 0 && (
            <div className="flex gap-1 bg-white/3 p-1 rounded-lg w-fit">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-150
                    ${filter === tab.value
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/35 hover:text-white/60'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.value === 'all' && total > 0 && (
                    <span className="text-[10px] bg-white/10 px-1.5 rounded-full">{total}</span>
                  )}
                  {tab.value === 'pending' && total - done > 0 && (
                    <span className="text-[10px] bg-white/10 px-1.5 rounded-full">{total - done}</span>
                  )}
                  {tab.value === 'completed' && done > 0 && (
                    <span className="text-[10px] bg-white/10 px-1.5 rounded-full">{done}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          <div className="space-y-2">
            {visible.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-white/20">
                  {filter === 'completed'
                    ? 'Nenhuma tarefa concluída'
                    : filter === 'pending'
                    ? 'Nenhuma tarefa pendente'
                    : 'Nenhuma tarefa ainda'}
                </p>
              </div>
            ) : isDraggable ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {visible.map((item) =>
                    isDivider(item) ? (
                      <SortableDividerItem
                        key={item.id}
                        divider={item}
                        onUpdateLabel={(label) => onUpdateDividerLabel(item.id, label)}
                        onRemove={() => onRemoveDivider(item.id)}
                      />
                    ) : (
                      <SortableTaskItem
                        key={item.id}
                        task={item}
                        onToggle={() => onToggleTask(item.id)}
                        onRemove={() => onRemoveTask(item.id)}
                      />
                    )
                  )}
                </SortableContext>
              </DndContext>
            ) : (
              visible.map((item) =>
                isDivider(item) ? null : (
                  <SortableTaskItem
                    key={item.id}
                    task={item}
                    onToggle={() => onToggleTask(item.id)}
                    onRemove={() => onRemoveTask(item.id)}
                  />
                )
              )
            )}
          </div>

          {/* Add actions */}
          <div className="space-y-2">
            <AddTaskForm onAdd={onAddTask} />
            <AddDividerForm onAdd={onAddDivider} />
          </div>
        </div>
      )}
    </div>
  )
}
