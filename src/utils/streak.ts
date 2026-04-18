import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Day } from '../types'
import { isTask } from '../types'

/**
 * Compute the current productivity streak — how many consecutive days
 * (ending today or yesterday) the user has completed >=50% of their tasks.
 * Days with zero tasks are skipped (don't break or extend the streak).
 */
export function computeStreak(days: Day[]): number {
  const today = new Date()
  // Build a map of date -> completion ratio, only for days that had tasks
  const scored = days
    .map((d) => {
      const tasks = d.tasks.filter(isTask)
      if (tasks.length === 0) return null
      const done = tasks.filter((t) => t.completed).length
      return { date: d.date, ratio: done / tasks.length }
    })
    .filter((x): x is { date: string; ratio: number } => x !== null)
    .sort((a, b) => b.date.localeCompare(a.date))

  if (scored.length === 0) return 0

  // Walk back from the most recent scored day
  let streak = 0
  let expected = differenceInCalendarDays(today, parseISO(scored[0].date)) <= 1
    ? parseISO(scored[0].date)
    : null

  if (!expected) return 0

  for (const entry of scored) {
    const date = parseISO(entry.date)
    const diff = differenceInCalendarDays(expected, date)
    if (diff === 0) {
      if (entry.ratio >= 0.5) {
        streak++
        expected = new Date(expected.getFullYear(), expected.getMonth(), expected.getDate() - 1)
      } else break
    } else if (diff > 0) {
      // Gap of days with no tasks — break the streak
      break
    }
    // diff < 0 means we haven't reached the expected day yet; skip
  }

  return streak
}
