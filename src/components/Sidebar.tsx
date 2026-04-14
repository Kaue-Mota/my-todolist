import { CheckSquare, Dumbbell, Timer } from 'lucide-react'

export type AppView = 'tasks' | 'workout' | 'pomodoro'

interface NavItem {
  id: AppView
  label: string
  icon: React.ReactNode
  color: string
  activeColor: string
  activeBg: string
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'tasks',
    label: 'My Day',
    icon: <CheckSquare size={20} />,
    color: 'text-white/40',
    activeColor: 'text-indigo-300',
    activeBg: 'bg-indigo-500/15 border-indigo-500/25',
  },
  {
    id: 'workout',
    label: 'Treino',
    icon: <Dumbbell size={20} />,
    color: 'text-white/40',
    activeColor: 'text-emerald-300',
    activeBg: 'bg-emerald-500/15 border-emerald-500/25',
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro',
    icon: <Timer size={20} />,
    color: 'text-white/40',
    activeColor: 'text-rose-300',
    activeBg: 'bg-rose-500/15 border-rose-500/25',
  },
]

interface Props {
  activeView: AppView
  onChangeView: (view: AppView) => void
}

export function Sidebar({ activeView, onChangeView }: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-white/6 bg-gray-950/80 backdrop-blur-xl px-3 py-6">
        <div className="px-3 mb-6">
          <span className="text-xs font-bold text-white/20 uppercase tracking-widest">
            Organizer
          </span>
        </div>

        <nav className="space-y-1">
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
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

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
