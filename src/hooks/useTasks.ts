import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Divider, Day, DayListItem } from '../types'
import { isDivider, isTask } from '../types'
import type { TaskPriority, Task } from '../types'
import { useLocalStorage } from './useLocalStorage'

const STORAGE_KEY = 'todolist-days'

export function useTasks() {
  const [days, setDays] = useLocalStorage<Day[]>(STORAGE_KEY, [])

  /** Overwrite state with a previous snapshot — used by undo actions. */
  const restoreSnapshot = useCallback((snapshot: Day[]) => {
    setDays(snapshot)
  }, [setDays])

  // ── Days ──────────────────────────────────────────────────────────────────

  const addDay = useCallback((date: string, label?: string) => {
    setDays((prev) => {
      const exists = prev.some((d) => d.date === date)
      if (exists) return prev

      // Pull in recurring tasks from the most recent existing day (if any).
      const template = [...prev].sort((a, b) => b.date.localeCompare(a.date))[0]
      const now = new Date().toISOString()
      const recurringTasks: DayListItem[] = template
        ? template.tasks
            .filter((t) => isTask(t) && t.recurring)
            .map((t) => ({
              ...(t as Task),
              id: uuidv4(),
              completed: false,
              completedAt: undefined,
              pomodoros: 0,
              createdAt: now,
            }))
        : []

      const newDay: Day = {
        id: uuidv4(),
        date,
        label: label?.trim() || undefined,
        tasks: recurringTasks,
        createdAt: now,
      }
      return [...prev, newDay].sort((a, b) => a.date.localeCompare(b.date))
    })
  }, [setDays])

  const removeDay = useCallback((dayId: string) => {
    setDays((prev) => prev.filter((d) => d.id !== dayId))
  }, [setDays])

  const updateDayLabel = useCallback((dayId: string, label: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, label: label.trim() || undefined } : d
      )
    )
  }, [setDays])

  // ── Tasks ─────────────────────────────────────────────────────────────────

  const addTask = useCallback(
    (dayId: string, title: string, description?: string, priority: TaskPriority = 'medium') => {
      const newTask: Task = {
        id: uuidv4(),
        title: title.trim(),
        description: description?.trim() || undefined,
        completed: false,
        priority,
        createdAt: new Date().toISOString(),
      }
      setDays((prev) =>
        prev.map((d) =>
          d.id === dayId ? { ...d, tasks: [...d.tasks, newTask] } : d
        )
      )
    },
    [setDays]
  )

  const toggleTask = useCallback((dayId: string, taskId: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d
        return {
          ...d,
          tasks: d.tasks.map((t) => {
            if (isDivider(t) || t.id !== taskId) return t
            const completed = !t.completed
            return { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined }
          }),
        }
      })
    )
  }, [setDays])

  const removeTask = useCallback((dayId: string, taskId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) } : d
      )
    )
  }, [setDays])

  const updateTask = useCallback(
    (dayId: string, taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'recurring'>>) => {
      setDays((prev) =>
        prev.map((d) =>
          d.id === dayId
            ? { ...d, tasks: d.tasks.map((t) => (isDivider(t) || t.id !== taskId ? t : { ...t, ...updates })) }
            : d
        )
      )
    },
    [setDays]
  )

  const toggleRecurring = useCallback((dayId: string, taskId: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d
        return {
          ...d,
          tasks: d.tasks.map((t) => {
            if (isDivider(t) || t.id !== taskId) return t
            return { ...t, recurring: t.recurring ? undefined : 'daily' }
          }),
        }
      })
    )
  }, [setDays])

  const incrementPomodoro = useCallback((dayId: string, taskId: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d
        return {
          ...d,
          tasks: d.tasks.map((t) => {
            if (isDivider(t) || t.id !== taskId) return t
            return { ...t, pomodoros: (t.pomodoros ?? 0) + 1 }
          }),
        }
      })
    )
  }, [setDays])

  const clearCompletedTasks = useCallback((dayId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, tasks: d.tasks.filter((t) => isDivider(t) || !t.completed) }
          : d
      )
    )
  }, [setDays])

  const reorderTasks = useCallback((dayId: string, oldIndex: number, newIndex: number) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d
        const tasks = [...d.tasks]
        const [moved] = tasks.splice(oldIndex, 1)
        tasks.splice(newIndex, 0, moved)
        return { ...d, tasks }
      })
    )
  }, [setDays])

  /** Move a task (or divider) to another day, appending at the end. */
  const moveTaskToDay = useCallback((fromDayId: string, toDayId: string, taskId: string) => {
    if (fromDayId === toDayId) return
    setDays((prev) => {
      const from = prev.find((d) => d.id === fromDayId)
      if (!from) return prev
      const item = from.tasks.find((t) => t.id === taskId)
      if (!item) return prev
      return prev.map((d) => {
        if (d.id === fromDayId) return { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) }
        if (d.id === toDayId)   return { ...d, tasks: [...d.tasks, item] }
        return d
      })
    })
  }, [setDays])

  // ── Dividers ──────────────────────────────────────────────────────────────

  const addDivider = useCallback((dayId: string, label: string) => {
    const newDivider: Divider = {
      id: uuidv4(),
      _type: 'divider',
      label: label.trim(),
      createdAt: new Date().toISOString(),
    }
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, tasks: [...d.tasks, newDivider] } : d
      )
    )
  }, [setDays])

  const updateDividerLabel = useCallback((dayId: string, dividerId: string, label: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              tasks: d.tasks.map((t) =>
                t.id === dividerId && isDivider(t) ? { ...t, label: label.trim() } : t
              ),
            }
          : d
      )
    )
  }, [setDays])

  const copyFromDay = useCallback((targetDayId: string, sourceDayId: string) => {
    setDays((prev) => {
      const source = prev.find((d) => d.id === sourceDayId)
      if (!source) return prev
      const now = new Date().toISOString()
      const copied = source.tasks.map((item) => {
        if (isDivider(item)) return { ...item, id: uuidv4(), createdAt: now }
        return { ...item, id: uuidv4(), completed: false, completedAt: undefined, pomodoros: 0, createdAt: now }
      })
      return prev.map((d) =>
        d.id === targetDayId ? { ...d, tasks: [...d.tasks, ...copied] } : d
      )
    })
  }, [setDays])

  return {
    days,
    restoreSnapshot,
    addDay,
    removeDay,
    updateDayLabel,
    addTask,
    toggleTask,
    removeTask,
    updateTask,
    toggleRecurring,
    incrementPomodoro,
    clearCompletedTasks,
    reorderTasks,
    moveTaskToDay,
    addDivider,
    updateDividerLabel,
    copyFromDay,
  }
}
