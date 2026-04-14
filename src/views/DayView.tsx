import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { DayCard } from '../components/DayCard'
import { AddDayModal } from '../components/AddDayModal'
import { StatsBar } from '../components/StatsBar'
import { EmptyState } from '../components/EmptyState'

export function DayView() {
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
  } = useTasks()

  return (
    <div className="space-y-6">
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
        <div className="space-y-4">
          {days.map((day, index) => {
            const prevDay = index > 0 ? days[index - 1] : undefined
            return (
              <DayCard
                key={day.id}
                day={day}
                onRemoveDay={() => removeDay(day.id)}
                onAddTask={(title, description, priority) =>
                  addTask(day.id, title, description, priority)
                }
                onToggleTask={(taskId) => toggleTask(day.id, taskId)}
                onRemoveTask={(taskId) => removeItem(day.id, taskId)}
                onClearCompleted={() => clearCompletedTasks(day.id)}
                onReorderTasks={(oldIndex, newIndex) =>
                  reorderTasks(day.id, oldIndex, newIndex)
                }
                onAddDivider={(label) => addDivider(day.id, label)}
                onUpdateDividerLabel={(dividerId, label) =>
                  updateDividerLabel(day.id, dividerId, label)
                }
                onRemoveDivider={(dividerId) => removeItem(day.id, dividerId)}
                copySource={prevDay ? { id: prevDay.id, date: prevDay.date } : undefined}
                onCopyFromDay={(sourceId) => copyFromDay(day.id, sourceId)}
              />
            )
          })}
        </div>
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
