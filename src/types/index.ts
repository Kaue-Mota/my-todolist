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

export interface Day {
  id: string
  date: string        // ISO date string: "2024-01-15"
  label?: string      // Optional custom label e.g. "Sprint Planning"
  tasks: Task[]
  createdAt: string
}

export interface AppState {
  days: Day[]
}
