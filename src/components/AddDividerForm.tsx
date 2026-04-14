import { useState, type FormEvent } from 'react'
import { Minus } from 'lucide-react'

interface Props {
  onAdd: (label: string) => void
  accentColor?: 'indigo' | 'emerald'
}

export function AddDividerForm({ onAdd, accentColor = 'indigo' }: Props) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')

  const border = accentColor === 'emerald'
    ? 'border-emerald-500/30 bg-emerald-500/5 focus:border-emerald-400/60'
    : 'border-indigo-500/30 bg-indigo-500/5 focus:border-indigo-400/60'

  const btnColor = accentColor === 'emerald'
    ? 'bg-emerald-600 hover:bg-emerald-500'
    : 'bg-indigo-500 hover:bg-indigo-400'

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onAdd(label || 'Seção')
    setLabel('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/8 text-white/25 hover:text-white/50 hover:border-white/15 hover:bg-white/3 transition-all duration-200 text-xs"
      >
        <Minus size={13} />
        Adicionar divisória
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 rounded-xl border p-3 ${accentColor === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-indigo-500/30 bg-indigo-500/5'}`}
    >
      <Minus size={14} className="shrink-0 text-white/30" />
      <input
        autoFocus
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nome da seção (ex: Perna, Braço...)"
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className={`flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/20 outline-none transition-all ${border}`}
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-white/35 hover:text-white/60 px-1 transition-colors"
      >
        ✕
      </button>
      <button
        type="submit"
        className={`px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors ${btnColor}`}
      >
        Adicionar
      </button>
    </form>
  )
}
