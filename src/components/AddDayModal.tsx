import { useState, useEffect, type FormEvent } from 'react'
import { X, CalendarPlus } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  open: boolean
  existingDates: string[]
  onClose: () => void
  onAdd: (date: string, label?: string) => void
}

export function AddDayModal({ open, existingDates, onClose, onAdd }: Props) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (open) {
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setLabel('')
    }
  }, [open])

  if (!open) return null

  const alreadyExists = existingDates.includes(date)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!date || alreadyExists) return
    onAdd(date, label || undefined)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/15">
              <CalendarPlus size={18} className="text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Adicionar dia</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/60 focus:bg-white/8 transition-all"
            />
            {alreadyExists && (
              <p className="text-xs text-rose-400">Este dia já foi adicionado.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Rótulo <span className="normal-case text-white/25">(opcional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Sprint, Reunião, Viagem..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-400/60 focus:bg-white/8 transition-all"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-white/40 hover:text-white/70 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!date || alreadyExists}
              className="flex-1 py-2.5 text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
