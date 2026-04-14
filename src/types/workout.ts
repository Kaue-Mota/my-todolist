import type { Divider } from './index'

export interface Exercise {
  id: string
  name: string
  setsReps: string   // free-form: "2x10", "3x30s", "4xmax", "5 min"
  completed: boolean
  notes?: string
  createdAt: string
}

export type WorkoutListItem = Exercise | Divider

export function isExercise(item: WorkoutListItem): item is Exercise {
  return !('_type' in item && item._type === 'divider')
}

export interface WorkoutDay {
  id: string
  date: string
  label?: string
  exercises: WorkoutListItem[]
  createdAt: string
}
