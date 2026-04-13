import { CalendarPlus } from 'lucide-react'

interface Props {
  onAddDay: () => void
}

export function EmptyState({ onAddDay }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <CalendarPlus size={36} className="text-indigo-400/60" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500/30 animate-ping" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white/70">Nenhum dia adicionado</h3>
        <p className="text-sm text-white/30 max-w-xs">
          Adicione um dia para começar a organizar suas tarefas.
        </p>
      </div>
      <button
        onClick={onAddDay}
        className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
      >
        <CalendarPlus size={16} />
        Adicionar dia
      </button>
    </div>
  )
}
