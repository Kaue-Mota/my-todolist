export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskFilter = 'all' | 'pending' | 'completed'

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: TaskPriority
  createdAt: string
  completedAt?: string
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
