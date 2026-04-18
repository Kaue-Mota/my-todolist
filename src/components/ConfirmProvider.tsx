import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider')
  return ctx.confirm
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setState(options)
    })
  }, [])

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result)
    resolveRef.current = null
    setState(null)
  }, [])

  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
      if (e.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, close])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" onClick={() => close(false)}>
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${state.destructive ? 'bg-rose-500/15 text-rose-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white leading-tight">{state.title}</h3>
                {state.message && (
                  <p className="mt-1 text-sm text-white/55 leading-relaxed">{state.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white/90 hover:bg-white/5 rounded-xl transition-colors"
              >
                {state.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                onClick={() => close(true)}
                autoFocus
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg
                  ${state.destructive
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20'}`}
              >
                {state.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
