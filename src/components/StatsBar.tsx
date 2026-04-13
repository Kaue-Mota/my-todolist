import { CheckCircle2, Circle, CalendarDays, Flame } from 'lucide-react'
import type { Day } from '../types'

interface Props {
  days: Day[]
}

export function StatsBar({ days }: Props) {
  const totalTasks = days.reduce((sum, d) => sum + d.tasks.length, 0)
  const completedTasks = days.reduce((sum, d) => sum + d.tasks.filter((t) => t.completed).length, 0)
  const pendingTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const stats = [
    {
      icon: <CalendarDays size={16} className="text-violet-400" />,
      value: days.length,
      label: 'Dias',
      color: 'text-violet-400',
    },
    {
      icon: <Circle size={16} className="text-amber-400" />,
      value: pendingTasks,
      label: 'Pendentes',
      color: 'text-amber-400',
    },
    {
      icon: <CheckCircle2 size={16} className="text-emerald-400" />,
      value: completedTasks,
      label: 'Concluídas',
      color: 'text-emerald-400',
    },
    {
      icon: <Flame size={16} className="text-orange-400" />,
      value: `${completionRate}%`,
      label: 'Conclusão',
      color: 'text-orange-400',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex flex-col items-center gap-1 bg-white/3 border border-white/6 rounded-2xl py-3 px-2"
        >
          {s.icon}
          <span className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</span>
          <span className="text-[11px] text-white/30 font-medium">{s.label}</span>
        </div>
      ))}
    </div>
  )
}
