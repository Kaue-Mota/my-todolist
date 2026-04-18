export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskFilter = 'all' | 'pending' | 'completed'

export type TaskRecurrence = 'daily' | 'weekly'

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: TaskPriority
  createdAt: string
  completedAt?: string
  /** Count of completed pomodoro sessions linked to this task. */
  pomodoros?: number
  /** When set, this task is auto-copied to newly-created days. */
  recurring?: TaskRecurrence
}

/** A visual separator with an optional label, shared by all list types. */
export interface Divider {
  id: string
  _type: 'divider'
  label: string
  createdAt: string
}

export type DayListItem = Task | Divider

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDivider(item: any): item is Divider {
  return item?._type === 'divider'
}

export function isTask(item: DayListItem): item is Task {
  return !isDivider(item)
}

export interface Day {
  id: string
  date: string
  label?: string
  tasks: DayListItem[]
  createdAt: string
}

export interface AppState {
  days: Day[]
}
