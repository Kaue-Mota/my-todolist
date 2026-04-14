import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Settings, Wind, X, ChevronDown } from 'lucide-react'
import {
  usePomodoroContext,
  PHASE_META,
  NOISE_META,
  type Phase,
  type NoiseType,
  type PomodoroSettings,
  playClick,
} from '../context/PomodoroContext'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const R      = 88;   const CIRC      = 2 * Math.PI * R
const FULL_R = 130;  const FULL_CIRC = 2 * Math.PI * FULL_R

// ─────────────────────────────────────────────────────────────────────────────
// Fullscreen overlay (triggered from the Pomodoro tab)
// ─────────────────────────────────────────────────────────────────────────────

function PomodoroFullscreenView({ onClose }: { onClose: () => void }) {
  const {
    phase, timeLeft, running, settings, sessionsDone,
    noiseOn, noiseType, toggleRun, reset, switchPhase, toggleNoise, setNoiseType,
  } = usePomodoroContext()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 320)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close when timer is paused
  const prevRunning = useRef(running)
  useEffect(() => {
    if (prevRunning.current && !running) handleClose()
    prevRunning.current = running
  }, [running])

  const meta = PHASE_META[phase]
  const total = (phase === 'work' ? settings.workMin : phase === 'short' ? settings.shortMin : settings.longMin) * 60
  const ratio = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 0
  const dashOffset = FULL_CIRC * (1 - ratio)
  const sessionDots = Array.from({ length: settings.sessionsBeforeLong })

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'rgba(3,7,18,0.97)',
        backdropFilter: 'blur(28px)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: 560, height: 560,
          background: meta.ring,
          opacity: mounted ? 0.07 : 0,
          transition: 'opacity 0.7s ease, background 0.6s ease',
        }}
      />

      {/* Content card */}
      <div
        className="relative flex flex-col items-center gap-8 px-8 py-10 w-full max-w-sm"
        style={{
          transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.4) translateY(80px)',
          opacity: mounted ? 1 : 0,
          transformOrigin: 'bottom center',
          transition: mounted
            ? 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease'
            : 'transform 0.28s ease, opacity 0.22s ease',
        }}
      >
        {/* Top controls */}
        <div className="absolute top-0 right-0 flex items-center gap-1">
          <button
            onClick={toggleNoise}
            className={`p-2 rounded-xl border transition-all ${noiseOn ? 'text-sky-300 bg-sky-500/15 border-sky-500/25' : 'text-white/25 border-transparent hover:text-white/60 hover:bg-white/5'}`}
            title="Ambiente sonoro"
          >
            <Wind size={16} />
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-white/25 hover:text-white/70 hover:bg-white/5 border border-transparent transition-all"
            title="Minimizar (Esc)"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {/* Noise type selector (fullscreen) */}
        {noiseOn && (
          <div className="absolute top-0 left-0 flex items-center gap-1">
            {(Object.keys(NOISE_META) as NoiseType[]).map((t) => (
              <button
                key={t}
                onClick={() => setNoiseType(t)}
                title={NOISE_META[t].label}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${noiseType === t ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'border-transparent text-white/25 hover:text-white/60 hover:bg-white/5'}`}
              >
                {NOISE_META[t].emoji} {NOISE_META[t].label}
              </button>
            ))}
          </div>
        )}

        {/* Phase tabs */}
        <div className="flex gap-1.5 bg-white/5 p-1 rounded-2xl w-full">
          {(['work', 'short', 'long'] as Phase[]).map((p) => (
            <button
              key={p}
              onClick={() => switchPhase(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200
                ${phase === p ? PHASE_META[p].activeTab : `border-transparent ${PHASE_META[p].tab}`}`}
            >
              {PHASE_META[p].label}
            </button>
          ))}
        </div>

        {/* Ring */}
        <div className="relative flex items-center justify-center">
          <svg width="300" height="300" className="-rotate-90">
            <circle cx="150" cy="150" r={FULL_R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle
              cx="150" cy="150" r={FULL_R} fill="none"
              stroke={meta.ring} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={FULL_CIRC} strokeDashoffset={dashOffset}
              style={{ transition: running ? 'stroke-dashoffset 0.25s linear' : 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center gap-1">
            <span
              className="text-7xl font-bold font-mono tabular-nums tracking-tight leading-none"
              style={{ color: meta.ring }}
            >
              {fmt(timeLeft)}
            </span>
            <span className="text-sm text-white/30 uppercase tracking-widest font-medium mt-2">
              {meta.label}
            </span>
          </div>
        </div>

        {/* Session dots */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            {sessionDots.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < (sessionsDone % settings.sessionsBeforeLong) ? '' : 'bg-white/12'}`}
                style={i < (sessionsDone % settings.sessionsBeforeLong) ? { background: meta.ring } : {}}
              />
            ))}
          </div>
          <p className="text-xs text-white/25">
            Sessão {(sessionsDone % settings.sessionsBeforeLong) + 1} de {settings.sessionsBeforeLong}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={reset}
            className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/8 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={toggleRun}
            className="flex-1 flex items-center justify-center gap-2.5 h-14 rounded-2xl font-bold text-base transition-all border"
            style={{ background: `${meta.ring}22`, borderColor: `${meta.ring}44`, color: meta.ring }}
          >
            {running ? <Pause size={20} /> : <Play size={20} />}
            {running ? 'Pausar' : 'Iniciar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────────────────────────────────────

export function PomodoroView() {
  const {
    settings, setSettings,
    phase, timeLeft, running, sessionsDone,
    noiseOn, noiseVol, noiseType,
    toggleRun, reset, switchPhase,
    toggleNoise, setNoiseVol, setNoiseType,
  } = usePomodoroContext()

  const [showSettings, setShowSettings] = useState(false)
  const [draft, setDraft] = useState<PomodoroSettings>(settings)
  const [fullscreen, setFullscreen] = useState(false)

  // Open fullscreen when timer starts
  useEffect(() => {
    if (running) setFullscreen(true)
  }, [running])

  const meta = PHASE_META[phase]
  const total = (phase === 'work' ? settings.workMin : phase === 'short' ? settings.shortMin : settings.longMin) * 60
  const ratio = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 0
  const dashOffset = CIRC * (1 - ratio)
  const sessionDots = Array.from({ length: settings.sessionsBeforeLong })

  function openSettings() { playClick(); setDraft(settings); setShowSettings(true) }
  function saveSettings() { setSettings(draft); setShowSettings(false) }

  return (
    <div className="flex flex-col items-center">
      {/* Fullscreen overlay */}
      {fullscreen && <PomodoroFullscreenView onClose={() => setFullscreen(false)} />}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Configurações</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all">
                <X size={16} />
              </button>
            </div>

            {(
              [
                { key: 'workMin',             label: 'Foco',                       color: 'text-rose-400',    min: 1, max: 60 },
                { key: 'shortMin',            label: 'Pausa curta',               color: 'text-emerald-400', min: 1, max: 30 },
                { key: 'longMin',             label: 'Pausa longa',               color: 'text-sky-400',     min: 1, max: 30 },
                { key: 'sessionsBeforeLong',  label: 'Sessões até pausa longa',   color: 'text-violet-400',  min: 1, max: 8  },
              ] as const
            ).map(({ key, label, color, min, max }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</label>
                  <span className="text-xs text-white/50">
                    {draft[key]}{key !== 'sessionsBeforeLong' ? ' min' : ''}
                  </span>
                </div>
                <input
                  type="range" min={min} max={max}
                  value={draft[key]}
                  onChange={(e) => setDraft((s) => ({ ...s, [key]: Number(e.target.value) }))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            ))}

            <button onClick={saveSettings} className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-colors">
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm mx-auto pt-4 pb-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Pomodoro</h1>
          <button onClick={openSettings} className="p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/5 transition-all">
            <Settings size={18} />
          </button>
        </div>

        {/* Phase tabs */}
        <div className="flex gap-1.5 bg-white/3 p-1 rounded-2xl">
          {(['work', 'short', 'long'] as Phase[]).map((p) => (
            <button
              key={p}
              onClick={() => switchPhase(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200
                ${phase === p ? PHASE_META[p].activeTab : `border-transparent ${PHASE_META[p].tab}`}`}
            >
              {PHASE_META[p].label}
            </button>
          ))}
        </div>

        {/* Ring */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-1000" style={{ background: meta.ring }} />
            <svg width="220" height="220" className="-rotate-90 relative">
              <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="110" cy="110" r={R} fill="none"
                stroke={meta.ring} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={dashOffset}
                style={{ transition: running ? 'stroke-dashoffset 0.25s linear' : 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-5xl font-bold font-mono tabular-nums leading-none tracking-tight" style={{ color: meta.ring }}>
                {fmt(timeLeft)}
              </span>
              <span className="text-xs text-white/30 font-medium uppercase tracking-widest mt-1">{meta.label}</span>
            </div>
          </div>

          {/* Session dots */}
          <div className="flex items-center gap-2">
            {sessionDots.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i < (sessionsDone % settings.sessionsBeforeLong) ? '' : 'bg-white/15'}`}
                style={i < (sessionsDone % settings.sessionsBeforeLong) ? { background: meta.ring } : {}}
              />
            ))}
          </div>
          <p className="text-xs text-white/25">
            Sessão {(sessionsDone % settings.sessionsBeforeLong) + 1} de {settings.sessionsBeforeLong}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button onClick={reset} className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/8 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all">
            <RotateCcw size={18} />
          </button>
          <button
            onClick={toggleRun}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-bold text-sm transition-all border"
            style={{ background: `${meta.ring}22`, borderColor: `${meta.ring}44`, color: meta.ring }}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? 'Pausar' : 'Iniciar'}
          </button>
        </div>

        {/* Ambient sound */}
        <div className={`rounded-2xl border p-4 space-y-3 transition-all duration-300 ${noiseOn ? 'border-sky-500/30 bg-sky-500/5' : 'border-white/8 bg-white/3'}`}>
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wind size={16} className={noiseOn ? 'text-sky-400' : 'text-white/30'} />
              <span className={`text-sm font-semibold ${noiseOn ? 'text-sky-300' : 'text-white/40'}`}>Ambiente sonoro</span>
              {noiseOn && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-medium">ON</span>}
            </div>
            <button
              onClick={toggleNoise}
              className={`relative w-10 rounded-full border transition-all duration-200 ${noiseOn ? 'bg-sky-500 border-sky-400' : 'bg-white/10 border-white/15'}`}
              style={{ height: '22px' }}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${noiseOn ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Type selector — always visible */}
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(NOISE_META) as NoiseType[]).map((t) => (
              <button
                key={t}
                onClick={() => setNoiseType(t)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-semibold transition-all duration-150
                  ${noiseType === t
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                    : 'border-white/6 bg-white/3 text-white/35 hover:text-white/70 hover:bg-white/7'}`}
              >
                <span className="text-base leading-none">{NOISE_META[t].emoji}</span>
                {NOISE_META[t].label}
              </button>
            ))}
          </div>

          {/* Volume (only when on) */}
          {noiseOn && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-white/30">
                <span>Volume</span>
                <span>{Math.round(noiseVol * 1000)}%</span>
              </div>
              <input type="range" min={5} max={100} value={Math.round(noiseVol * 1000)} onChange={(e) => setNoiseVol(Number(e.target.value) / 1000)} className="w-full accent-sky-400 cursor-pointer" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
