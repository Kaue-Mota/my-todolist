import { useState } from 'react'
import { Sidebar, type AppView } from './components/Sidebar'
import { DayView } from './views/DayView'
import { WorkoutView } from './views/WorkoutView'
import { PomodoroView } from './views/PomodoroView'
import { PomodoroProvider } from './context/PomodoroContext'
import { PomodoroMiniWidget } from './components/pomodoro/PomodoroMiniWidget'

function App() {
  const [activeView, setActiveView] = useState<AppView>('tasks')

  return (
    <PomodoroProvider>
      <div className="flex min-h-screen bg-gray-950 text-white">
        {/* Ambient background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/6 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/6 rounded-full blur-3xl" />
        </div>

        <Sidebar activeView={activeView} onChangeView={setActiveView} />

        <main className="relative z-10 flex-1 overflow-y-auto">
          {/* All views stay mounted — Pomodoro timer and white noise survive tab switches */}
          <div className={`max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8 ${activeView === 'tasks' ? '' : 'hidden'}`}>
            <DayView />
          </div>
          <div className={`max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8 ${activeView === 'workout' ? '' : 'hidden'}`}>
            <WorkoutView />
          </div>
          <div className={`max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8 ${activeView === 'pomodoro' ? '' : 'hidden'}`}>
            <PomodoroView />
          </div>
        </main>

        {/* Floating mini Pomodoro widget shown on other tabs */}
        <PomodoroMiniWidget
          activeView={activeView}
          onGoToPomodoro={() => setActiveView('pomodoro')}
        />
      </div>
    </PomodoroProvider>
  )
}

export default App
