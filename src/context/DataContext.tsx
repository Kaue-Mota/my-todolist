import { createContext, useContext } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useWorkout } from '../hooks/useWorkout'

type TasksValue = ReturnType<typeof useTasks>
type WorkoutValue = ReturnType<typeof useWorkout>

const TasksContext = createContext<TasksValue | null>(null)
const WorkoutContext = createContext<WorkoutValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const tasks = useTasks()
  const workout = useWorkout()
  return (
    <TasksContext.Provider value={tasks}>
      <WorkoutContext.Provider value={workout}>
        {children}
      </WorkoutContext.Provider>
    </TasksContext.Provider>
  )
}

export function useTasksContext() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasksContext must be used inside DataProvider')
  return ctx
}

export function useWorkoutContext() {
  const ctx = useContext(WorkoutContext)
  if (!ctx) throw new Error('useWorkoutContext must be used inside DataProvider')
  return ctx
}
