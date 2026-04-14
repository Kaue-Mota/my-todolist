import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { WorkoutDay, Exercise } from '../types/workout'
import type { Divider } from '../types'
import { isDivider } from '../types'
import { useLocalStorage } from './useLocalStorage'

const STORAGE_KEY = 'workout-days'

export function useWorkout() {
  const [days, setDays] = useLocalStorage<WorkoutDay[]>(STORAGE_KEY, [])

  // ── Days ──────────────────────────────────────────────────────────────────

  const ensureDays = useCallback((dates: string[]) => {
    setDays((prev) => {
      const toAdd: WorkoutDay[] = dates
        .filter((date) => !prev.some((d) => d.date === date))
        .map((date) => ({
          id: uuidv4(),
          date,
          exercises: [],
          createdAt: new Date().toISOString(),
        }))
      if (toAdd.length === 0) return prev
      return [...prev, ...toAdd].sort((a, b) => a.date.localeCompare(b.date))
    })
  }, [setDays])

  const removeDay = useCallback((dayId: string) => {
    setDays((prev) => prev.filter((d) => d.id !== dayId))
  }, [setDays])

  // ── Exercises ─────────────────────────────────────────────────────────────

  const addExercise = useCallback(
    (dayId: string, name: string, setsReps: string, notes?: string) => {
      const newExercise: Exercise = {
        id: uuidv4(),
        name: name.trim(),
        setsReps: setsReps.trim(),
        completed: false,
        notes: notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
      }
      setDays((prev) =>
        prev.map((d) =>
          d.id === dayId ? { ...d, exercises: [...d.exercises, newExercise] } : d
        )
      )
    },
    [setDays]
  )

  const toggleExercise = useCallback((dayId: string, exerciseId: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d
        return {
          ...d,
          exercises: d.exercises.map((e) =>
            isDivider(e) || e.id !== exerciseId ? e : { ...e, completed: !e.completed }
          ),
        }
      })
    )
  }, [setDays])

  const removeExercise = useCallback((dayId: string, exerciseId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.filter((e) => e.id !== exerciseId) }
          : d
      )
    )
  }, [setDays])

  const reorderExercises = useCallback(
    (dayId: string, oldIndex: number, newIndex: number) => {
      setDays((prev) =>
        prev.map((d) => {
          if (d.id !== dayId) return d
          const exercises = [...d.exercises]
          const [moved] = exercises.splice(oldIndex, 1)
          exercises.splice(newIndex, 0, moved)
          return { ...d, exercises }
        })
      )
    },
    [setDays]
  )

  const clearCompletedExercises = useCallback((dayId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.filter((e) => isDivider(e) || !e.completed) }
          : d
      )
    )
  }, [setDays])

  const resetExercises = useCallback((dayId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.map((e) => (isDivider(e) ? e : { ...e, completed: false })) }
          : d
      )
    )
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
        d.id === dayId ? { ...d, exercises: [...d.exercises, newDivider] } : d
      )
    )
  }, [setDays])

  const updateDividerLabel = useCallback((dayId: string, dividerId: string, label: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              exercises: d.exercises.map((e) =>
                e.id === dividerId && isDivider(e) ? { ...e, label: label.trim() } : e
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
      const copied = source.exercises.map((item) => {
        if (isDivider(item)) return { ...item, id: uuidv4(), createdAt: now }
        return { ...item, id: uuidv4(), completed: false, createdAt: now }
      })
      return prev.map((d) =>
        d.id === targetDayId ? { ...d, exercises: [...d.exercises, ...copied] } : d
      )
    })
  }, [setDays])

  return {
    days,
    ensureDays,
    removeDay,
    addExercise,
    toggleExercise,
    removeExercise,
    reorderExercises,
    clearCompletedExercises,
    resetExercises,
    addDivider,
    updateDividerLabel,
    copyFromDay,
  }
}
