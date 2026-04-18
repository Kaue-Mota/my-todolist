import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useTasksContext } from '../context/DataContext'
import { DayCard } from '../components/DayCard'
import { AddDayModal } from '../components/AddDayModal'
import { StatsBar } from '../components/StatsBar'
import { EmptyState } from '../components/EmptyState'
import { useToast } from '../components/ToastProvider'
import { useConfirm } from '../components/ConfirmProvider'
import { isTask, type DayListItem } from '../types'
import { TaskItem } from '../components/TaskItem'
import { DividerItem } from '../components/DividerItem'
import type { FocusRequest } from '../App'

interface Props {
  focusRequest: FocusRequest | null
  onFocusHandled: () => void
  addHint: { token: number } | null
}

export function DayView({ focusRequest, onFocusHandled, addHint }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const {
    days,
    addDay,
    removeDay,
    addTask,
    toggleTask,
    clearCompletedTasks,
    reorderTasks,
    addDivider,
    updateDividerLabel,
    removeTask: removeItem,
    copyFromDay,
    toggleRecurring,
    moveTaskToDay,
    restoreSnapshot,
  } = useTasksContext()

  const toast = useToast()
  const confirm = useConfirm()

  const [activeDragItem, setActiveDragItem] = useState<DayListItem | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Map each item id to its day id, so drag-between-days can locate origin quickly
  const itemDayMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const d of days) for (const t of d.tasks) m.set(t.id, d.id)
    return m
  }, [days])

  // Handle focus-request (from search palette) — scroll item into view and flash it
  useEffect(() => {
    if (!focusRequest) return
    const el = document.getElementById(`task-item-${focusRequest.itemId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-indigo-500/70')
      setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500/70'), 1800)
    }
    onFocusHandled()
  }, [focusRequest, onFocusHandled])

  // Add hint — scroll first day into view and trigger an event
  useEffect(() => {
    if (!addHint) return
    if (days.length === 0) {
      setModalOpen(true)
      return
    }
    const el = document.getElementById(`task-addform-${days[0].id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Dispatch a synthetic event the AddTaskForm listens for
    window.dispatchEvent(new CustomEvent('organizer:add-task', { detail: { dayId: days[0].id } }))
  }, [addHint, days])

  function handleDragStart(e: DragStartEvent) {
    for (const d of days) {
      const found = d.tasks.find((t) => t.id === e.active.id)
      if (found) { setActiveDragItem(found); return }
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDragItem(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    const fromDayId = itemDayMap.get(String(active.id))
    if (!fromDayId) return

    // Determine target day: either the over item's day, or the day card itself (id = 'dropzone-{dayId}')
    let toDayId: string | null = null
    let overIndex = -1

    const overIdStr = String(over.id)
    if (overIdStr.startsWith('dropzone-')) {
      toDayId = overIdStr.slice('dropzone-'.length)
    } else {
      toDayId = itemDayMap.get(overIdStr) ?? null
      if (toDayId) {
        const toDay = days.find((d) => d.id === toDayId)
        overIndex = toDay?.tasks.findIndex((t) => t.id === overIdStr) ?? -1
      }
    }
    if (!toDayId) return

    if (fromDayId === toDayId) {
      const day = days.find((d) => d.id === fromDayId)!
      const oldIndex = day.tasks.findIndex((t) => t.id === active.id)
      if (oldIndex !== -1 && overIndex !== -1 && oldIndex !== overIndex) {
        reorderTasks(fromDayId, oldIndex, overIndex)
      }
    } else {
      const snapshot = days
      moveTaskToDay(fromDayId, toDayId, String(active.id))
      const fromDay = days.find((d) => d.id === fromDayId)
      const toDay = days.find((d) => d.id === toDayId)
      toast.show(
        `Movido para ${toDay?.date ? toDay.date.slice(8, 10) + '/' + toDay.date.slice(5, 7) : ''}`,
        {
          tone: 'default',
          action: { label: 'Desfazer', onClick: () => restoreSnapshot(snapshot) },
        }
      )
      // suppress unused warning
      void fromDay
    }
  }

  async function handleRemoveDay(dayId: string) {
    const day = days.find((d) => d.id === dayId)
    if (!day) return
    if (day.tasks.length > 0) {
      const ok = await confirm({
        title: 'Remover este dia?',
        message: `O dia tem ${day.tasks.filter(isTask).length} tarefa(s). Tudo será removido.`,
        confirmLabel: 'Remover',
        destructive: true,
      })
      if (!ok) return
    }
    const snapshot = days
    removeDay(dayId)
    toast.show('Dia removido', {
      action: { label: 'Desfazer', onClick: () => restoreSnapshot(snapshot) },
    })
  }

  function handleRemoveItem(dayId: string, itemId: string) {
    const snapshot = days
    removeItem(dayId, itemId)
    toast.show('Removido', {
      action: { label: 'Desfazer', onClick: () => restoreSnapshot(snapshot) },
    })
  }

  function handleClearCompleted(dayId: string) {
    const day = days.find((d) => d.id === dayId)
    const count = day?.tasks.filter((t) => isTask(t) && t.completed).length ?? 0
    if (count === 0) return
    const snapshot = days
    clearCompletedTasks(dayId)
    toast.show(`${count} concluída(s) removida(s)`, {
      action: { label: 'Desfazer', onClick: () => restoreSnapshot(snapshot) },
    })
  }

  const dayTargets = useMemo(
    () => days.map((d) => ({ id: d.id, date: d.date })),
    [days]
  )

  return (
    <div className="space-y-6" ref={scrollRef}>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white leading-none">My Day</h1>
          <p className="text-xs text-white/30 mt-0.5">Organize seu dia</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          <CalendarPlus size={16} />
          Novo dia
        </button>
      </header>

      {days.length > 0 && <StatsBar days={days} />}

      {days.length === 0 ? (
        <EmptyState onAddDay={() => setModalOpen(true)} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDragItem(null)}
        >
          <div className="space-y-4">
            {days.map((day, index) => {
              const prevDay = index > 0 ? days[index - 1] : undefined
              return (
                <DayCard
                  key={day.id}
                  day={day}
                  allDays={dayTargets}
                  onRemoveDay={() => handleRemoveDay(day.id)}
                  onAddTask={(title, description, priority) =>
                    addTask(day.id, title, description, priority)
                  }
                  onToggleTask={(taskId) => toggleTask(day.id, taskId)}
                  onRemoveTask={(taskId) => handleRemoveItem(day.id, taskId)}
                  onClearCompleted={() => handleClearCompleted(day.id)}
                  onAddDivider={(label) => addDivider(day.id, label)}
                  onUpdateDividerLabel={(dividerId, label) =>
                    updateDividerLabel(day.id, dividerId, label)
                  }
                  onRemoveDivider={(dividerId) => handleRemoveItem(day.id, dividerId)}
                  onToggleRecurring={(taskId) => toggleRecurring(day.id, taskId)}
                  onMoveTask={(taskId, toDayId) => {
                    const snapshot = days
                    moveTaskToDay(day.id, toDayId, taskId)
                    toast.show('Tarefa movida', {
                      action: { label: 'Desfazer', onClick: () => restoreSnapshot(snapshot) },
                    })
                  }}
                  copySource={prevDay ? { id: prevDay.id, date: prevDay.date } : undefined}
                  onCopyFromDay={(sourceId) => copyFromDay(day.id, sourceId)}
                />
              )
            })}
          </div>

          <DragOverlay>
            {activeDragItem && (
              <div className="opacity-90">
                {isTask(activeDragItem)
                  ? <TaskItem task={activeDragItem} onToggle={() => {}} onRemove={() => {}} />
                  : <DividerItem divider={activeDragItem} onUpdateLabel={() => {}} onRemove={() => {}} />}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <AddDayModal
        open={modalOpen}
        existingDates={days.map((d) => d.date)}
        onClose={() => setModalOpen(false)}
        onAdd={addDay}
      />
    </div>
  )
}
