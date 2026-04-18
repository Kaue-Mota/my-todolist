import { CheckCircle2, Circle, CalendarDays, Flame, Zap, Timer } from 'lucide-react'
import type { Day } from '../types'
import { isTask } from '../types'
import { computeStreak } from '../utils/streak'
import { usePomodoroContext } from '../context/PomodoroContext'

interface Props {
  days: Day[]
}

function formatFocusTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

export function StatsBar({ days }: Props) {
  const { focusToday } = usePomodoroContext()
  const allTasks = days.flatMap((d) => d.tasks.filter(isTask))
  const completedTasks = allTasks.filter((t) => t.completed)
  const pendingTasks = allTasks.length - completedTasks.length
  const completionRate = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0
  const streak = computeStreak(days)

  const stats = [
    { icon: <CalendarDays size={16} className="text-violet-400" />, value: days.length, label: 'Dias', color: 'text-violet-400' },
    { icon: <Circle size={16} className="text-amber-400" />, value: pendingTasks, label: 'Pendentes', color: 'text-amber-400' },
    { icon: <CheckCircle2 size={16} className="text-emerald-400" />, value: completedTasks.length, label: 'Concluídas', color: 'text-emerald-400' },
    { icon: <Flame size={16} className="text-orange-400" />, value: `${completionRate}%`, label: 'Conclusão', color: 'text-orange-400' },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1 bg-white/3 border border-white/6 rounded-2xl py-3 px-2">
            {s.icon}
            <span className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</span>
            <span className="text-[11px] text-white/30 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Secondary row: streak + focus time — only show when there's data to show */}
      {(streak > 0 || focusToday.seconds > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 bg-white/3 border border-white/6 rounded-2xl py-2.5 px-4">
            <Zap size={14} className={streak > 0 ? 'text-rose-400' : 'text-white/25'} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white/85 leading-none">
                {streak > 0 ? `${streak} dia${streak > 1 ? 's' : ''}` : '—'}
              </div>
              <div className="text-[11px] text-white/35">Streak</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white/3 border border-white/6 rounded-2xl py-2.5 px-4">
            <Timer size={14} className={focusToday.seconds > 0 ? 'text-indigo-400' : 'text-white/25'} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white/85 leading-none">
                {focusToday.seconds > 0 ? formatFocusTime(focusToday.seconds) : '—'}
              </div>
              <div className="text-[11px] text-white/35">Foco hoje</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
