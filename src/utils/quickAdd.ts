import type { TaskPriority } from '../types'

export interface ParsedQuickAdd {
  title: string
  priority: TaskPriority
}

/**
 * Parse a task title for inline priority hints:
 *   "!alta Comprar pão"   → high
 *   "!1 Estudar"          → low
 *   "!2 algo"             → medium
 *   "!3 algo"             → high
 *   "!high Foo"           → high
 * The hint can appear at the start or end. The rest becomes the title.
 */
export function parseQuickAdd(input: string, fallback: TaskPriority = 'medium'): ParsedQuickAdd {
  const text = input.trim()
  if (!text) return { title: '', priority: fallback }

  const tokenMap: Record<string, TaskPriority> = {
    '1': 'low',     low: 'low',     baixa: 'low',   b: 'low',
    '2': 'medium',  med: 'medium',  media: 'medium', média: 'medium', medium: 'medium', m: 'medium',
    '3': 'high',    high: 'high',   alta: 'high',   a: 'high',
  }

  const re = /!([a-zà-ú0-9]+)/i
  const match = text.match(re)
  if (!match) return { title: text, priority: fallback }

  const key = match[1].toLowerCase()
  const priority = tokenMap[key]
  if (!priority) return { title: text, priority: fallback }

  const title = text.replace(re, '').replace(/\s+/g, ' ').trim()
  return { title, priority }
}
