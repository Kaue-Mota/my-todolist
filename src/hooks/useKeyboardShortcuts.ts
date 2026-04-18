import { useEffect } from 'react'

export interface ShortcutHandler {
  /** Key combo: supports 'ctrl+k', 'cmd+k', 'shift+/', bare letters/digits. */
  combo: string
  description?: string
  handler: (e: KeyboardEvent) => void
  /** Allow the shortcut to fire even when typing in an input/textarea. Default: false */
  allowInInput?: boolean
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function matchCombo(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split('+').map((p) => p.trim())
  const key = parts[parts.length - 1]
  const mods = new Set(parts.slice(0, -1))

  const needsCtrl  = mods.has('ctrl')
  const needsCmd   = mods.has('cmd') || mods.has('meta')
  const needsMod   = mods.has('mod')  // either ctrl or cmd
  const needsShift = mods.has('shift')
  const needsAlt   = mods.has('alt')

  if (needsCtrl  && !e.ctrlKey)  return false
  if (needsCmd   && !e.metaKey)  return false
  if (needsMod   && !(e.ctrlKey || e.metaKey)) return false
  if (needsShift !== e.shiftKey) return false
  if (needsAlt   !== e.altKey)   return false

  // Disallow extra modifiers unless requested
  if (!needsCtrl && !needsMod && e.ctrlKey) return false
  if (!needsCmd  && !needsMod && e.metaKey) return false

  return e.key.toLowerCase() === key
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[], enabled = true) {
  useEffect(() => {
    if (!enabled) return
    function onKey(e: KeyboardEvent) {
      const inInput = isEditableTarget(e.target)
      for (const sc of shortcuts) {
        if (inInput && !sc.allowInInput) continue
        if (matchCombo(e, sc.combo)) {
          e.preventDefault()
          sc.handler(e)
          return
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcuts, enabled])
}
