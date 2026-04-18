import { CheckSquare, Dumbbell, Timer, Search, Keyboard, Sun, Moon, Settings2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { Theme } from '../hooks/useTheme'
import { DataMenu } from './DataMenu'

export type AppView = 'tasks' | 'workout' | 'pomodoro'

interface NavItem {
  id: AppView
  label: string
  icon: React.ReactNode
  color: string
  activeColor: string
  activeBg: string
  shortcut: string
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'tasks',
    label: 'My Day',
    icon: <CheckSquare size={20} />,
    color: 'text-white/40',
    activeColor: 'text-indigo-300',
    activeBg: 'bg-indigo-500/15 border-indigo-500/25',
    shortcut: '1',
  },
  {
    id: 'workout',
    label: 'Treino',
    icon: <Dumbbell size={20} />,
    color: 'text-white/40',
    activeColor: 'text-emerald-300',
    activeBg: 'bg-emerald-500/15 border-emerald-500/25',
    shortcut: '2',
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro',
    icon: <Timer size={20} />,
    color: 'text-white/40',
    activeColor: 'text-rose-300',
    activeBg: 'bg-rose-500/15 border-rose-500/25',
    shortcut: '3',
  },
]

interface Props {
  activeView: AppView
  onChangeView: (view: AppView) => void
  onOpenSearch: () => void
  onOpenHelp: () => void
  theme: Theme
  onToggleTheme: () => void
}

export function Sidebar({ activeView, onChangeView, onOpenSearch, onOpenHelp, theme, onToggleTheme }: Props) {
  const [dataMenuOpen, setDataMenuOpen] = useState(false)
  const desktopDataRef = useRef<HTMLDivElement>(null)
  const mobileDataRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dataMenuOpen) return
    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (desktopDataRef.current?.contains(target)) return
      if (mobileDataRef.current?.contains(target)) return
      setDataMenuOpen(false)
    }
    setTimeout(() => document.addEventListener('click', close), 0)
    return () => document.removeEventListener('click', close)
  }, [dataMenuOpen])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-white/6 bg-gray-950/80 backdrop-blur-xl px-3 py-6">
        <div className="px-3 mb-6 flex items-center justify-between">
          <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Organizer</span>
        </div>

        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-2 mb-3 rounded-xl border border-white/8 bg-white/3 text-white/40 hover:text-white/80 hover:bg-white/5 transition-all text-sm"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Buscar</span>
          <kbd className="font-mono text-[10px] bg-white/5 border border-white/10 rounded px-1 py-0.5">/</kbd>
        </button>

        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150
                  ${isActive
                    ? `${item.activeBg} ${item.activeColor} border-transparent`
                    : `border-transparent ${item.color} hover:text-white/70 hover:bg-white/4`
                  }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                <kbd className="font-mono text-[10px] text-white/30 bg-white/5 border border-white/10 rounded px-1 py-0.5">{item.shortcut}</kbd>
              </button>
            )
          })}
        </nav>

        <div className="space-y-1 pt-3 border-t border-white/6">
          <div className="relative" ref={desktopDataRef}>
            <button
              onClick={() => setDataMenuOpen((v) => !v)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/4 transition-all"
            >
              <Settings2 size={16} />
              <span className="flex-1 text-left">Dados</span>
            </button>
            {dataMenuOpen && (
              <div className="absolute left-0 right-0 bottom-full mb-2">
                <DataMenu onClose={() => setDataMenuOpen(false)} />
              </div>
            )}
          </div>

          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/4 transition-all"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span className="flex-1 text-left">Tema {theme === 'dark' ? 'claro' : 'escuro'}</span>
          </button>

          <button
            onClick={onOpenHelp}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/4 transition-all"
          >
            <Keyboard size={16} />
            <span className="flex-1 text-left">Atalhos</span>
            <kbd className="font-mono text-[10px] text-white/30 bg-white/5 border border-white/10 rounded px-1 py-0.5">?</kbd>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center gap-1 px-3 py-2 border-b border-white/8 bg-gray-950/90 backdrop-blur-xl">
        <span className="text-[11px] font-bold text-white/25 uppercase tracking-widest pl-1">Organizer</span>
        <div className="flex-1" />
        <button onClick={onOpenSearch} className="p-2 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/5">
          <Search size={16} />
        </button>
        <button onClick={onOpenHelp} className="p-2 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/5">
          <Keyboard size={16} />
        </button>
        <button onClick={onToggleTheme} className="p-2 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/5">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="relative" ref={mobileDataRef}>
          <button
            onClick={() => setDataMenuOpen((v) => !v)}
            className="p-2 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/5"
          >
            <Settings2 size={16} />
          </button>
          {dataMenuOpen && (
            <div className="absolute right-0 top-full mt-1">
              <DataMenu onClose={() => setDataMenuOpen(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex border-t border-white/8 bg-gray-950/90 backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
                ${isActive ? item.activeColor : item.color}`}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </nav>
    </>
  )
}
