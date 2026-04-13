import { useState } from 'react'
import { CalendarPlus, CheckSquare } from 'lucide-react'
import { useTasks } from './hooks/useTasks'
import { DayCard } from './components/DayCard'
import { AddDayModal } from './components/AddDayModal'
import { StatsBar } from './components/StatsBar'
import { EmptyState } from './components/EmptyState'

function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const {
    days,
    addDay,
    removeDay,
    addTask,
    toggleTask,
    removeTask,
    clearCompletedTasks,
  } = useTasks()

  const existingDates = days.map((d) => d.date)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/25">
              <CheckSquare size={22} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-none">My Day</h1>
              <p className="text-xs text-white/30 mt-0.5">Organize seu dia</p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
          >
            <CalendarPlus size={16} />
            Novo dia
          </button>
        </header>

        {/* Stats */}
        {days.length > 0 && <StatsBar days={days} />}

        {/* Days List */}
        {days.length === 0 ? (
          <EmptyState onAddDay={() => setModalOpen(true)} />
        ) : (
          <div className="space-y-4">
            {days.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                onRemoveDay={() => removeDay(day.id)}
                onAddTask={(title, description, priority) =>
                  addTask(day.id, title, description, priority)
                }
                onToggleTask={(taskId) => toggleTask(day.id, taskId)}
                onRemoveTask={(taskId) => removeTask(day.id, taskId)}
                onClearCompleted={() => clearCompletedTasks(day.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Day Modal */}
      <AddDayModal
        open={modalOpen}
        existingDates={existingDates}
        onClose={() => setModalOpen(false)}
        onAdd={addDay}
      />
    </div>
  )
}

export default App
