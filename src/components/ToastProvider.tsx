import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: string
  message: string
  action?: ToastAction
  duration: number
  tone: 'default' | 'success' | 'error'
}

interface ToastOptions {
  duration?: number
  action?: ToastAction
  tone?: Toast['tone']
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const toneStyles: Record<Toast['tone'], string> = {
  default: 'border-white/15 bg-gray-800/95',
  success: 'border-emerald-500/30 bg-emerald-900/70',
  error:   'border-rose-500/30 bg-rose-900/70',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    const id = Math.random().toString(36).slice(2)
    const duration = options.duration ?? 4200
    const tone = options.tone ?? 'default'
    setToasts((t) => [...t, { id, message, action: options.action, duration, tone }])
  }, [])

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 inset-x-0 z-[100] flex flex-col items-center gap-2 px-3 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const mount = requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 220)
    }, toast.duration)
    return () => {
      cancelAnimationFrame(mount)
      clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 border rounded-2xl pl-4 pr-1.5 py-1.5 shadow-2xl backdrop-blur-md max-w-md ${toneStyles[toast.tone]}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
      }}
    >
      <span className="text-sm text-white/90 py-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => { toast.action!.onClick(); onDismiss(toast.id) }}
          className="text-xs font-bold text-indigo-300 hover:text-indigo-200 uppercase tracking-wide px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
        aria-label="Fechar"
      >
        <X size={13} />
      </button>
    </div>
  )
}
