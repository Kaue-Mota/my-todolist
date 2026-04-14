import { useState, useEffect, useMemo } from 'react'
import { format, startOfWeek, addDays, addWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Flame, CheckCircle2, Circle, CalendarDays } from 'lucide-react'
import { useWorkout } from '../hooks/useWorkout'
import { isExercise } from '../types/workout'
import { WorkoutDayCard } from '../components/workout/WorkoutDayCard'
import { WorkoutTimer } from '../components/workout/WorkoutTimer'

/** Returns the 5 ISO date strings for Mon–Fri of a given week offset (0 = current). */
function getWeekDates(offset: number): string[] {
  const monday = startOfWeek(addWeeks(new Date(), offset), { weekStartsOn: 1 })
  return Array.from({ length: 5 }, (_, i) =>
    format(addDays(monday, i), 'yyyy-MM-dd')
  )
}

function WeekStatsBar({ days }: { days: ReturnType<typeof useWorkout>['days'] }) {
  const totalEx = days.reduce((s, d) => s + d.exercises.filter(isExercise).length, 0)
  const doneEx = days.reduce((s, d) => s + d.exercises.filter((e) => isExercise(e) && e.completed).length, 0)
  const rate = totalEx > 0 ? Math.round((doneEx / totalEx) * 100) : 0

  const stats = [
    { icon: <CalendarDays size={16} className="text-teal-400" />, value: days.length, label: 'Dias', color: 'text-teal-400' },
    { icon: <Circle size={16} className="text-amber-400" />, value: totalEx - doneEx, label: 'Pendentes', color: 'text-amber-400' },
    { icon: <CheckCircle2 size={16} className="text-emerald-400" />, value: doneEx, label: 'Feitos', color: 'text-emerald-400' },
    { icon: <Flame size={16} className="text-orange-400" />, value: `${rate}%`, label: 'Progresso', color: 'text-orange-400' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-1 bg-white/3 border border-white/6 rounded-2xl py-3 px-2">
          {s.icon}
          <span className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</span>
          <span className="text-[11px] text-white/30 font-medium">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

export function WorkoutView() {
  const [weekOffset, setWeekOffset] = useState(0)
  const {
    days,
    ensureDays,
    addExercise,
    toggleExercise,
    reorderExercises,
    clearCompletedExercises,
    resetExercises,
    addDivider,
    updateDividerLabel,
    removeExercise: removeItem,
    copyFromDay,
  } = useWorkout()

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  // Auto-create Mon–Fri days for this week if they don't exist
  useEffect(() => {
    ensureDays(weekDates)
  }, [weekDates, ensureDays])

  // Only show the 5 days of the visible week
  const weekDays = weekDates
    .map((date) => days.find((d) => d.date === date))
    .filter(Boolean) as typeof days

  const isCurrentWeek = weekOffset === 0

  // Week label: "14 – 18 de abril" style
  const weekLabel = useMemo(() => {
    const monday = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
    const friday = addDays(monday, 4)
    const sameMonth = format(monday, 'M') === format(friday, 'M')
    if (sameMonth) {
      return `${format(monday, 'd')} – ${format(friday, "d 'de' MMMM", { locale: ptBR })}`
    }
    return `${format(monday, "d 'de' MMM", { locale: ptBR })} – ${format(friday, "d 'de' MMM", { locale: ptBR })}`
  }, [weekOffset])

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white leading-none">Treino</h1>
          <p className="text-xs text-white/30 mt-0.5">Seus exercícios da semana</p>
        </div>
      </header>

      {/* Week navigation */}
      <div className="flex items-center justify-between bg-white/3 border border-white/8 rounded-2xl px-4 py-3">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-white/80 capitalize">{weekLabel}</p>
          {isCurrentWeek && (
            <span className="text-[11px] text-indigo-400 font-medium">Semana atual</span>
          )}
        </div>

        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          disabled={isCurrentWeek}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {weekDays.length > 0 && <WeekStatsBar days={weekDays} />}

      {/* Days */}
      <div className="space-y-4">
        {weekDays.map((day, index) => {
          const prevDay = index > 0 ? weekDays[index - 1] : undefined
          return (
            <WorkoutDayCard
              key={day.id}
              day={day}
              onAddExercise={(name, setsReps, notes) =>
                addExercise(day.id, name, setsReps, notes)
              }
              onToggleExercise={(exerciseId) => toggleExercise(day.id, exerciseId)}
              onRemoveExercise={(exerciseId) => removeItem(day.id, exerciseId)}
              onReorderExercises={(oldIndex, newIndex) =>
                reorderExercises(day.id, oldIndex, newIndex)
              }
              onClearCompleted={() => clearCompletedExercises(day.id)}
              onReset={() => resetExercises(day.id)}
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

      <WorkoutTimer />
    </div>
  )
}
