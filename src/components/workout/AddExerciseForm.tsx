import { useEffect, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'

interface Props {
  dayId?: string
  onAdd: (name: string, setsReps: string, notes?: string) => void
}

// Quick-fill presets
const PRESETS = ['2x10', '3x10', '3x12', '4x8', '4x12', '3x15', '3x30s', '4x45s']

export function AddExerciseForm({ dayId, onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [setsReps, setSetsReps] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!dayId) return
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { dayId: string } | undefined
      if (detail?.dayId === dayId) setOpen(true)
    }
    window.addEventListener('organizer:add-exercise', onOpen)
    return () => window.removeEventListener('organizer:add-exercise', onOpen)
  }, [dayId])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !setsReps.trim()) return
    onAdd(name, setsReps, notes || undefined)
    setName('')
    setSetsReps('')
    setNotes('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 hover:bg-white/3 transition-all duration-200 text-sm"
      >
        <Plus size={15} />
        Adicionar exercício
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3"
    >
      <div className="flex gap-2">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exercício (ex: Flexão, Agachamento...)"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-emerald-400/60 focus:bg-white/8 transition-all"
        />
        <input
          type="text"
          value={setsReps}
          onChange={(e) => setSetsReps(e.target.value)}
          placeholder="2x10"
          className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-emerald-400/60 focus:bg-white/8 transition-all text-center font-mono"
        />
      </div>

      {/* Presets */}
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setSetsReps(p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all
              ${setsReps === p
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-white/35 border border-white/8 hover:bg-white/10 hover:text-white/60'
              }`}
          >
            {p}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Observação (opcional)"
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-emerald-400/60 focus:bg-white/8 transition-all"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!name.trim() || !setsReps.trim()}
          className="ml-auto px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Adicionar
        </button>
      </div>
    </form>
  )
}
