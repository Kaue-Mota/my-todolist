import { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: { section: string; items: { keys: string[]; label: string }[] }[] = [
  {
    section: 'Navegação',
    items: [
      { keys: ['1'], label: 'Abrir My Day' },
      { keys: ['2'], label: 'Abrir Treino' },
      { keys: ['3'], label: 'Abrir Pomodoro' },
      { keys: ['?'], label: 'Mostrar atalhos' },
    ],
  },
  {
    section: 'Ações',
    items: [
      { keys: ['N'], label: 'Nova tarefa / exercício' },
      { keys: ['Ctrl', 'K'], label: 'Buscar' },
      { keys: ['/'], label: 'Buscar' },
      { keys: ['Esc'], label: 'Fechar modal / busca' },
    ],
  },
  {
    section: 'Pomodoro',
    items: [
      { keys: ['Espaço'], label: 'Iniciar / pausar timer' },
      { keys: ['R'], label: 'Resetar fase atual' },
    ],
  },
]

export function ShortcutsHelp({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-indigo-400" />
            <h2 className="text-base font-bold text-white">Atalhos</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/5">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4">
          {SHORTCUTS.map((sec) => (
            <div key={sec.section}>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/35 mb-2">{sec.section}</h3>
              <ul className="space-y-1.5">
                {sec.items.map((it) => (
                  <li key={it.label} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{it.label}</span>
                    <span className="flex items-center gap-1">
                      {it.keys.map((k) => (
                        <kbd key={k} className="font-mono text-[11px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/80">{k}</kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
