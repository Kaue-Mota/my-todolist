import { useState } from 'react'
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, ChevronDown, ChevronUp, Eraser, RotateCcw, ClipboardCopy } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { WorkoutDay } from '../../types/workout'
import { isExercise } from '../../types/workout'
import { isDivider } from '../../types'
import { SortableExerciseItem } from './SortableExerciseItem'
import { SortableDividerItem } from '../SortableDividerItem'
import { AddExerciseForm } from './AddExerciseForm'
import { AddDividerForm } from '../AddDividerForm'

interface Props {
  day: WorkoutDay
  onAddExercise: (name: string, setsReps: string, notes?: string) => void
  onToggleExercise: (exerciseId: string) => void
  onRemoveExercise: (exerciseId: string) => void
  onReorderExercises: (oldIndex: number, newIndex: number) => void
  onClearCompleted: () => void
  onReset: () => void
  onAddDivider: (label: string) => void
  onUpdateDividerLabel: (dividerId: string, label: string) => void
  onRemoveDivider: (dividerId: string) => void
  onRemoveDay?: () => void
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
    card: 'border-emerald-500/35 bg-gradient-to-b from-emerald-950/35 to-gray-900/60',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    label: 'Hoje',
    bar: 'bg-emerald-500',
  },
  past: {
    card: 'border-white/8 bg-gray-900/40',
    badge: 'bg-white/8 text-white/40 border border-white/10',
    label: 'Passado',
    bar: 'bg-emerald-700',
  },
  future: {
    card: 'border-teal-500/20 bg-gray-900/50',
    badge: 'bg-teal-500/15 text-teal-300 border border-teal-500/25',
    label: 'Futuro',
    bar: 'bg-teal-500',
  },
}

export function WorkoutDayCard({
  day,
  onAddExercise,
  onToggleExercise,
  onRemoveExercise,
  onReorderExercises,
  onClearCompleted,
  onReset,
  onAddDivider,
  onUpdateDividerLabel,
  onRemoveDivider,
  onRemoveDay,
  copySource,
  onCopyFromDay,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const status = getDayStatus(day.date)
  const styles = statusStyles[status]
  const parsedDate = parseISO(day.date)

  const exercises = day.exercises.filter(isExercise)
  const total = exercises.length
  const done = exercises.filter((e) => e.completed).length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = day.exercises.findIndex((e) => e.id === active.id)
    const newIndex = day.exercises.findIndex((e) => e.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) onReorderExercises(oldIndex, newIndex)
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
            <p className="mt-0.5 text-xs font-semibold text-white/45 uppercase tracking-wide">
              {day.label}
            </p>
          )}

          {total > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden max-w-30">
                <div
                  className={`h-full ${styles.bar} rounded-full transition-all duration-500`}
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
              title={`Copiar exercícios de ${format(parseISO(copySource.date), "EEE, d/MM", { locale: ptBR })}`}
              className="p-1.5 rounded-lg text-white/25 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-150"
            >
              <ClipboardCopy size={15} />
            </button>
          )}
          {done > 0 && (
            <>
              <button
                onClick={onReset}
                title="Desmarcar todos"
                className="p-1.5 rounded-lg text-white/25 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-150"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={onClearCompleted}
                title="Remover concluídos"
                className="p-1.5 rounded-lg text-white/25 hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-150"
              >
                <Eraser size={15} />
              </button>
            </>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-all duration-150"
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
          {onRemoveDay && (
            <button
              onClick={onRemoveDay}
              className="p-1.5 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="px-5 pb-4 space-y-3">
          {/* Exercise list */}
          <div className="space-y-2">
            {day.exercises.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-white/20">Nenhum exercício ainda</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={day.exercises.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {day.exercises.map((item) =>
                    isDivider(item) ? (
                      <SortableDividerItem
                        key={item.id}
                        divider={item}
                        onUpdateLabel={(label) => onUpdateDividerLabel(item.id, label)}
                        onRemove={() => onRemoveDivider(item.id)}
                      />
                    ) : (
                      <SortableExerciseItem
                        key={item.id}
                        exercise={item}
                        onToggle={() => onToggleExercise(item.id)}
                        onRemove={() => onRemoveExercise(item.id)}
                      />
                    )
                  )}
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="space-y-2">
            <AddExerciseForm onAdd={onAddExercise} />
            <AddDividerForm onAdd={onAddDivider} accentColor="emerald" />
          </div>
        </div>
      )}
    </div>
  )
}
