import { useState, useEffect, useRef, useCallback } from 'react'
import { Timer, Play, Pause, RotateCcw, ChevronDown } from 'lucide-react'

// ── Sound ────────────────────────────────────────────────────────────────────

function playFinishSound() {
  try {
    const ctx = new AudioContext()
    const schedule = [
      { t: 0.00, freq: 880, dur: 0.12 },
      { t: 0.20, freq: 880, dur: 0.12 },
      { t: 0.40, freq: 880, dur: 0.12 },
      { t: 0.70, freq: 1047, dur: 0.45 },
    ]
    schedule.forEach(({ t, freq, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + t)
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + dur + 0.05)
    })
  } catch {
    // AudioContext not supported
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '45s', seconds: 45 },
  { label: '1min', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2min', seconds: 120 },
  { label: '3min', seconds: 180 },
]

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// SVG ring
const R = 44
const CIRC = 2 * Math.PI * R

function getRingColor(ratio: number) {
  if (ratio > 0.5) return '#22c55e'   // green
  if (ratio > 0.25) return '#f59e0b'  // amber
  return '#ef4444'                    // red
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WorkoutTimer() {
  const [open, setOpen] = useState(false)
  const [total, setTotal] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tick
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setRunning(false)
          setFinished(true)
          playFinishSound()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [running])

  const selectPreset = useCallback((seconds: number) => {
    setRunning(false)
    setFinished(false)
    setTotal(seconds)
    setTimeLeft(seconds)
    clearInterval(intervalRef.current!)
  }, [])

  const toggleRun = () => {
    if (finished) {
      setFinished(false)
      setTimeLeft(total)
      setRunning(true)
      return
    }
    setRunning((r) => !r)
  }

  const reset = () => {
    setRunning(false)
    setFinished(false)
    setTimeLeft(total)
    clearInterval(intervalRef.current!)
  }

  const ratio = total > 0 ? timeLeft / total : 0
  const strokeDashoffset = CIRC * (1 - ratio)
  const ringColor = finished ? '#a855f7' : getRingColor(ratio)

  return (
    <>
      {/* Floating toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl shadow-lg border transition-all duration-200
            ${running
              ? 'bg-gray-900 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
              : 'bg-gray-900 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
            }`}
        >
          <Timer size={16} />
          <span className={`text-sm font-mono font-semibold tabular-nums ${running ? 'text-emerald-300' : ''}`}>
            {fmt(timeLeft)}
          </span>
          {running && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      )}

      {/* Timer panel */}
      {open && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-72 bg-gray-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <Timer size={15} className="text-white/40" />
              <span className="text-sm font-semibold text-white/70">Cronômetro</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
            >
              <ChevronDown size={15} />
            </button>
          </div>

          {/* Ring + time */}
          <div className="flex flex-col items-center py-4">
            <div className="relative">
              <svg width="120" height="120" className="-rotate-90">
                {/* Track */}
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                {/* Progress */}
                <circle
                  cx="60" cy="60" r={R}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: running ? 'stroke-dashoffset 1s linear, stroke 0.3s' : 'stroke 0.3s' }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-2xl font-bold font-mono tabular-nums leading-none"
                  style={{ color: finished ? '#a855f7' : ringColor }}
                >
                  {fmt(timeLeft)}
                </span>
                {finished && (
                  <span className="text-[10px] font-semibold text-purple-400 mt-0.5 uppercase tracking-wide">
                    Fim!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="px-4 pb-3 flex flex-wrap gap-1.5 justify-center">
            {PRESETS.map((p) => (
              <button
                key={p.seconds}
                onClick={() => selectPreset(p.seconds)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                  ${total === p.seconds && !finished
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/5 text-white/40 border border-white/8 hover:bg-white/10 hover:text-white/70'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 px-4 pb-4">
            <button
              onClick={reset}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/8 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={toggleRun}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-semibold text-sm transition-all
                ${running
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
                }`}
            >
              {running ? <Pause size={16} /> : <Play size={16} />}
              {running ? 'Pausar' : finished ? 'Repetir' : 'Iniciar'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
