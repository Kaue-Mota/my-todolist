import type { TaskPriority } from '../types'

const config: Record<TaskPriority, { label: string; classes: string }> = {
  low: {
    label: 'Baixa',
    classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
  medium: {
    label: 'Média',
    classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  },
  high: {
    label: 'Alta',
    classes: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  },
}

interface Props {
  priority: TaskPriority
}

export function PriorityBadge({ priority }: Props) {
  const { label, classes } = config[priority]
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${classes}`}>
      {label}
    </span>
  )
}
