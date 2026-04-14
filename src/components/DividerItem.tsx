import { useState, useRef, useEffect } from 'react'
import { Trash2, Pencil, Check } from 'lucide-react'
import type { Divider } from '../types'

interface Props {
  divider: Divider
  onUpdateLabel: (label: string) => void
  onRemove: () => void
}

export function DividerItem({ divider, onUpdateLabel, onRemove }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(divider.label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed) onUpdateLabel(trimmed)
    else setDraft(divider.label)
    setEditing(false)
  }

  return (
    <div className="group flex items-center gap-2 py-1">
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') { setDraft(divider.label); setEditing(false) }
            }}
            onBlur={commit}
            className="bg-white/8 border border-indigo-400/40 rounded-lg px-2 py-0.5 text-xs font-semibold text-white/70 outline-none w-36 text-center"
          />
          <div className="flex-1 h-px bg-white/10" />
          <button
            onMouseDown={(e) => { e.preventDefault(); commit() }}
            className="p-1 rounded text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Check size={13} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 h-px bg-white/10" />
          {divider.label && (
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-white/30 px-1">
              {divider.label}
            </span>
          )}
          <div className="flex-1 h-px bg-white/10" />

          {/* Actions – visible on hover */}
          <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => { setDraft(divider.label); setEditing(true) }}
              className="p-1 rounded text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
              aria-label="Renomear divisória"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={onRemove}
              className="p-1 rounded text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              aria-label="Remover divisória"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
