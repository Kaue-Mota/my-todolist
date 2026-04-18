import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar, type AppView } from './components/Sidebar'
import { DayView } from './views/DayView'
import { WorkoutView } from './views/WorkoutView'
import { PomodoroView } from './views/PomodoroView'
import { PomodoroProvider, usePomodoroContext } from './context/PomodoroContext'
import { PomodoroMiniWidget } from './components/pomodoro/PomodoroMiniWidget'
import { ToastProvider, useToast } from './components/ToastProvider'
import { ConfirmProvider } from './components/ConfirmProvider'
import { DataProvider, useTasksContext, useWorkoutContext } from './context/DataContext'
import { SearchPalette } from './components/SearchPalette'
import { ShortcutsHelp } from './components/ShortcutsHelp'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useTheme } from './hooks/useTheme'

// ─────────────────────────────────────────────────────────────────────────────
// Focus-request bus — lets search palette scroll to a specific item
// ─────────────────────────────────────────────────────────────────────────────

export interface FocusRequest {
  kind: 'task' | 'exercise'
  dayId: string
  itemId: string
  /** Random salt to re-trigger the effect if the same request is sent twice. */
  nonce: number
}

interface AppShellProps {
  activeView: AppView
  setActiveView: (v: AppView) => void
  focusRequest: FocusRequest | null
  setFocusRequest: (r: FocusRequest | null) => void
  openSearch: () => void
  openHelp: () => void
  addTaskHint: { token: number } | null
  addExerciseHint: { token: number } | null
  requestAddTask: () => void
  requestAddExercise: () => void
}

function AppShell({
  activeView, setActiveView,
  focusRequest, setFocusRequest,
  addTaskHint, addExerciseHint,
  requestAddTask, requestAddExercise,
}: AppShellProps) {
  return (
    <main className="relative z-10 flex-1 overflow-y-auto">
      <div className={`max-w-2xl mx-auto px-4 pt-16 md:pt-8 pb-24 md:pb-8 ${activeView === 'tasks' ? '' : 'hidden'}`}>
        <DayView
          focusRequest={focusRequest?.kind === 'task' ? focusRequest : null}
          onFocusHandled={() => setFocusRequest(null)}
          addHint={addTaskHint}
        />
      </div>
      <div className={`max-w-2xl mx-auto px-4 pt-16 md:pt-8 pb-24 md:pb-8 ${activeView === 'workout' ? '' : 'hidden'}`}>
        <WorkoutView
          focusRequest={focusRequest?.kind === 'exercise' ? focusRequest : null}
          onFocusHandled={() => setFocusRequest(null)}
          addHint={addExerciseHint}
        />
      </div>
      <div className={`max-w-2xl mx-auto px-4 pt-16 md:pt-8 pb-24 md:pb-8 ${activeView === 'pomodoro' ? '' : 'hidden'}`}>
        <PomodoroView />
      </div>

      <PomodoroMiniWidget
        activeView={activeView}
        onGoToPomodoro={() => setActiveView('pomodoro')}
      />

      {/* Used by shortcut N */}
      <button
        id="__shortcut_add_task"
        style={{ display: 'none' }}
        onClick={requestAddTask}
        aria-hidden
      />
      <button
        id="__shortcut_add_exercise"
        style={{ display: 'none' }}
        onClick={requestAddExercise}
        aria-hidden
      />
    </main>
  )
}

function AppInner() {
  const [activeView, setActiveView] = useState<AppView>('tasks')
  const [searchOpen, setSearchOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)
  const [addTaskHint, setAddTaskHint] = useState<{ token: number } | null>(null)
  const [addExerciseHint, setAddExerciseHint] = useState<{ token: number } | null>(null)

  const { theme, toggle: toggleTheme } = useTheme()
  const { days: taskDays } = useTasksContext()
  const { days: workoutDays } = useWorkoutContext()
  const pomodoro = usePomodoroContext()
  const toast = useToast()

  // Notification permission — track if user enabled it in settings
  const notifRequested = useRef(false)
  useEffect(() => {
    if (pomodoro.settings.notificationsEnabled && !notifRequested.current) {
      notifRequested.current = true
      pomodoro.requestNotifications()
    }
  }, [pomodoro.settings.notificationsEnabled, pomodoro])

  // Hook: when a work session completes AND an active task is linked, increment its pomodoro count
  const { incrementPomodoro } = useTasksContext()
  useEffect(() => {
    const off = pomodoro.onWorkComplete((link) => {
      incrementPomodoro(link.dayId, link.taskId)
      toast.show(`+1 pomodoro em "${link.title}"`, { tone: 'success' })
    })
    return off
  }, [pomodoro, incrementPomodoro, toast])

  const navigateToTask = useCallback((dayId: string, taskId: string) => {
    setActiveView('tasks')
    setFocusRequest({ kind: 'task', dayId, itemId: taskId, nonce: Date.now() })
  }, [])

  const navigateToExercise = useCallback((dayId: string, exerciseId: string) => {
    setActiveView('workout')
    setFocusRequest({ kind: 'exercise', dayId, itemId: exerciseId, nonce: Date.now() })
  }, [])

  const requestAddTask = useCallback(() => {
    setActiveView('tasks')
    setAddTaskHint({ token: Date.now() })
  }, [])

  const requestAddExercise = useCallback(() => {
    setActiveView('workout')
    setAddExerciseHint({ token: Date.now() })
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const shortcuts = useMemo(() => [
    { combo: '1', handler: () => setActiveView('tasks') },
    { combo: '2', handler: () => setActiveView('workout') },
    { combo: '3', handler: () => setActiveView('pomodoro') },
    { combo: 'n', handler: () => { if (activeView === 'workout') requestAddExercise(); else requestAddTask() } },
    { combo: '/', handler: () => setSearchOpen(true) },
    { combo: 'mod+k', handler: () => setSearchOpen(true) },
    { combo: '?', handler: () => setHelpOpen(true) },
    { combo: 'shift+?', handler: () => setHelpOpen(true) },
    {
      combo: ' ',
      handler: () => {
        if (activeView === 'pomodoro') pomodoro.toggleRun()
      },
    },
    {
      combo: 'r',
      handler: () => {
        if (activeView === 'pomodoro') pomodoro.reset()
      },
    },
  ], [activeView, pomodoro, requestAddExercise, requestAddTask])

  useKeyboardShortcuts(shortcuts, !searchOpen && !helpOpen)

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/6 rounded-full blur-3xl" />
      </div>

      <Sidebar
        activeView={activeView}
        onChangeView={setActiveView}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <AppShell
        activeView={activeView}
        setActiveView={setActiveView}
        focusRequest={focusRequest}
        setFocusRequest={setFocusRequest}
        openSearch={() => setSearchOpen(true)}
        openHelp={() => setHelpOpen(true)}
        addTaskHint={addTaskHint}
        addExerciseHint={addExerciseHint}
        requestAddTask={requestAddTask}
        requestAddExercise={requestAddExercise}
      />

      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        days={taskDays}
        workoutDays={workoutDays}
        onNavigateTask={navigateToTask}
        onNavigateExercise={navigateToExercise}
      />

      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

function App() {
  return (
    <PomodoroProvider>
      <DataProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AppInner />
          </ConfirmProvider>
        </ToastProvider>
      </DataProvider>
    </PomodoroProvider>
  )
}

export default App
