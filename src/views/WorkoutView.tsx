import { useEffect, useMemo, useState } from 'react'
import { format, startOfWeek, addDays, addWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Flame, CheckCircle2, Circle, CalendarDays } from 'lucide-react'
import { useWorkoutContext } from '../context/DataContext'
import { isExercise } from '../types/workout'
import { WorkoutDayCard } from '../components/workout/WorkoutDayCard'
import { WorkoutTimer } from '../components/workout/WorkoutTimer'
import { useToast } from '../components/ToastProvider'
import { useConfirm } from '../components/ConfirmProvider'
import type { FocusRequest } from '../App'

function getWeekDates(offset: number): string[] {
  const monday = startOfWeek(addWeeks(new Date(), offset), { weekStartsOn: 1 })
  return Array.from({ length: 5 }, (_, i) =>
    format(addDays(monday, i), 'yyyy-MM-dd')
  )
}

function WeekStatsBar({ days }: { days: ReturnType<typeof useWorkoutContext>['days'] }) {
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

interface Props {
  focusRequest: FocusRequest | null
  onFocusHandled: () => void
  addHint: { token: number } | null
}

export function WorkoutView({ focusRequest, onFocusHandled, addHint }: Props) {
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
    restoreSnapshot,
  } = useWorkoutContext()

  const toast = useToast()
  const confirm = useConfirm()

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  useEffect(() => {
    ensureDays(weekDates)
  }, [weekDates, ensureDays])

  const weekDays = weekDates
    .map((date) => days.find((d) => d.date === date))
    .filter(Boolean) as typeof days

  const isCurrentWeek = weekOffset === 0

  const weekLabel = useMemo(() => {
    const monday = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
    const friday = addDays(monday, 4)
    const sameMonth = format(monday, 'M') === format(friday, 'M')
    if (sameMonth) {
      return `${format(monday, 'd')} – ${format(friday, "d 'de' MMMM", { locale: ptBR })}`
    }
    return `${format(monday, "d 'de' MMM", { locale: ptBR })} – ${format(friday, "d 'de' MMM", { locale: ptBR })}`
  }, [weekOffset])

  useEffect(() => {
    if (!focusRequest) return
    // Search result may be from another week — find it and jump there if needed
    const owner = days.find((d) => d.exercises.some((e) => e.id === focusRequest.itemId))
    if (owner) {
      const owningDate = owner.date
      const idx = weekDates.findIndex((d) => d === owningDate)
      if (idx === -1) {
        // Compute offset based on Monday of that week
        const mondayOfThatWeek = startOfWeek(new Date(owningDate + 'T00:00:00'), { weekStartsOn: 1 })
        const mondayOfCurrent = startOfWeek(new Date(), { weekStartsOn: 1 })
        const diffDays = Math.round((mondayOfThatWeek.getTime() - mondayOfCurrent.getTime()) / 86400000)
        setWeekOffset(Math.round(diffDays / 7))
      }
    }
    // Defer scroll until render
    const tid = setTimeout(() => {
      const el = document.getElementById(`exercise-item-${focusRequest.itemId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-emerald-400/70')
        setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-400/70'), 1800)
      }
      onFocusHandled()
    }, 60)
    return () => clearTimeout(tid)
  }, [focusRequest, days, weekDates, onFocusHandled])

  useEffect(() => {
    if (!addHint) return
    const todayKey = format(new Date(), 'yyyy-MM-dd')
    const target = weekDays.find((d) => d.date === todayKey) ?? weekDays[0]
    if (!target) return
    const el = document.getElementById(`exercise-addform-${target.id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.dispatchEvent(new CustomEvent('organizer:add-exercise', { detail: { dayId: target.id } }))
  }, [addHint, weekDays])

  async function handleRemoveDay(dayId: string) {
    const day = days.find((d) => d.id === dayId)
    if (!day) return
    if (day.exercises.length > 0) {
      const ok = await confirm({
        title: 'Remover este dia de treino?',
        message: 'Todos os exercícios serão removidos.',
        confirmLabel: 'Remover',
        destructive: true,
      })
      if (!ok) return
    }
    const snapshot = days
    // workout hook has no removeDay in this path — days auto-recreate via ensureDays — so just clear exercises
    const snap = days
    // reuse restoreSnapshot: empty the day's exercises
    restoreSnapshot(days.map((d) => d.id === dayId ? { ...d, exercises: [] } : d))
    toast.show('Exercícios removidos', {
      action: { label: 'Desfazer', onClick: () => restoreSnapshot(snapshot) },
    })
    void snap
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
    const count = day?.exercises.filter((e) => isExercise(e) && e.completed).length ?? 0
    if (count === 0) return
    const snapshot = days
    clearCompletedExercises(dayId)
    toast.show(`${count} concluído(s) removido(s)`, {
      action: { label: 'Desfazer', onClick: () => restoreSnapshot(snapshot) },
    })
  }

  function handleReset(dayId: string) {
    const snapshot = days
    resetExercises(dayId)
    toast.show('Marcações resetadas', {
      action: { label: 'Desfazer', onClick: () => restoreSnapshot(snapshot) },
    })
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white leading-none">Treino</h1>
          <p className="text-xs text-white/30 mt-0.5">Seus exercícios da semana</p>
        </div>
      </header>

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
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {weekDays.length > 0 && <WeekStatsBar days={weekDays} />}

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
              onRemoveExercise={(exerciseId) => handleRemoveItem(day.id, exerciseId)}
              onReorderExercises={(oldIndex, newIndex) =>
                reorderExercises(day.id, oldIndex, newIndex)
              }
              onClearCompleted={() => handleClearCompleted(day.id)}
              onReset={() => handleReset(day.id)}
              onAddDivider={(label) => addDivider(day.id, label)}
              onUpdateDividerLabel={(dividerId, label) =>
                updateDividerLabel(day.id, dividerId, label)
              }
              onRemoveDivider={(dividerId) => handleRemoveItem(day.id, dividerId)}
              onRemoveDay={() => handleRemoveDay(day.id)}
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
