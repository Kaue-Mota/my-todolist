import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Phase = 'work' | 'short' | 'long'
export type NoiseType = 'white' | 'brown' | 'water'

export interface PomodoroSettings {
  workMin: number
  shortMin: number
  longMin: number
  sessionsBeforeLong: number
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
  workMin: 25,
  shortMin: 5,
  longMin: 15,
  sessionsBeforeLong: 4,
}

export const PHASE_META: Record<Phase, { label: string; ring: string; activeTab: string; tab: string }> = {
  work:  { label: 'Foco',        ring: '#f43f5e', activeTab: 'bg-rose-500/15 text-rose-300 border-rose-500/25',     tab: 'text-white/40 hover:text-white/70' },
  short: { label: 'Pausa',       ring: '#22c55e', activeTab: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', tab: 'text-white/40 hover:text-white/70' },
  long:  { label: 'Pausa longa', ring: '#38bdf8', activeTab: 'bg-sky-500/15 text-sky-300 border-sky-500/25',        tab: 'text-white/40 hover:text-white/70' },
}

export const NOISE_META: Record<NoiseType, { label: string; emoji: string }> = {
  white: { label: 'Branco', emoji: '☁️' },
  brown: { label: 'Marrom', emoji: '🟤' },
  water: { label: 'Água',   emoji: '💧' },
}

interface PomodoroContextValue {
  settings: PomodoroSettings
  setSettings: (s: PomodoroSettings) => void
  phase: Phase
  timeLeft: number
  running: boolean
  sessionsDone: number
  noiseOn: boolean
  noiseVol: number
  noiseType: NoiseType
  toggleRun: () => void
  reset: () => void
  switchPhase: (p: Phase) => void
  toggleNoise: () => void
  setNoiseVol: (v: number) => void
  setNoiseType: (t: NoiseType) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio engine (module-level singletons)
// ─────────────────────────────────────────────────────────────────────────────

let _audioCtx: AudioContext | null = null
let _noiseSource: AudioBufferSourceNode | null = null
let _noiseGain: GainNode | null = null
let _noiseCtx: AudioContext | null = null
let _noiseActiveType: NoiseType | null = null

function getCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === 'closed') _audioCtx = new AudioContext()
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

function tone(freq: number, offset: number, dur: number, vol = 0.25) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.connect(g); g.connect(ctx.destination)
  osc.type = 'sine'; osc.frequency.value = freq
  const t = ctx.currentTime + offset
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.start(t); osc.stop(t + dur + 0.05)
}

export function playClick()        { tone(660, 0, 0.06, 0.12) }
export function playWorkComplete() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.18, 0.25, 0.3)) }
export function playBreakComplete(){ tone(1047, 0, 0.35, 0.25); tone(784, 0.30, 0.4, 0.2); tone(659, 0.55, 0.5, 0.15) }
export function playWhoosh() {
  try {
    const ctx = getCtx()
    const len = ctx.sampleRate * 0.15
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource(); src.buffer = buf
    const flt = ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 1200; flt.Q.value = 0.5
    const g = ctx.createGain(); g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    src.connect(flt); flt.connect(g); g.connect(ctx.destination); src.start()
  } catch { /**/ }
}

// Fill a buffer with the samples for the requested noise type
function fillNoiseBuffer(d: Float32Array, type: NoiseType) {
  if (type === 'white') {
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1

  } else if (type === 'brown') {
    // Brownian / red noise — integrate white noise
    let last = 0
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.5
    }

  } else {
    // water — pink noise via Voss-McCartney approximation
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886*b0 + w*0.0555179
      b1 = 0.99332*b1 + w*0.0750759
      b2 = 0.96900*b2 + w*0.1538520
      b3 = 0.86650*b3 + w*0.3104856
      b4 = 0.55000*b4 + w*0.5329522
      b5 = -0.7616*b5 - w*0.0168980
      d[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.11
      b6 = w * 0.115926
    }
  }
}

// Build a new noise graph for the given type; returns the gain node (starts silent)
function buildNoiseGraph(ctx: AudioContext, type: NoiseType): GainNode {
  const rate = ctx.sampleRate
  const buf = ctx.createBuffer(1, rate * 4, rate)
  fillNoiseBuffer(buf.getChannelData(0), type)

  const src = ctx.createBufferSource()
  src.buffer = buf; src.loop = true

  const gain = ctx.createGain(); gain.gain.value = 0

  if (type === 'white') {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2500
    src.connect(lp); lp.connect(gain)
  } else if (type === 'brown') {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1000
    src.connect(lp); lp.connect(gain)
  } else {
    // water — pink noise with mid-range focus
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200
    src.connect(lp); lp.connect(gain)
  }

  gain.connect(ctx.destination)
  src.start()
  _noiseSource = src
  return gain
}

function tearDownNoise() {
  try { _noiseSource?.stop() } catch { /**/ }
  try { _noiseGain?.disconnect() } catch { /**/ }
  _noiseSource = null; _noiseGain = null; _noiseCtx = null; _noiseActiveType = null
}

function ensureNoiseNodes(ctx: AudioContext, type: NoiseType): GainNode {
  if (_noiseGain && _noiseCtx === ctx && _noiseActiveType === type) return _noiseGain
  tearDownNoise()
  _noiseGain = buildNoiseGraph(ctx, type)
  _noiseCtx = ctx
  _noiseActiveType = type
  return _noiseGain
}

export function startNoise(volume: number, type: NoiseType) {
  try {
    const ctx = getCtx()
    const gain = ensureNoiseNodes(ctx, type)
    gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.05)
  } catch { /**/ }
}

export function stopNoise() {
  try {
    if (_noiseGain && _noiseCtx) {
      _noiseGain.gain.setTargetAtTime(0, _noiseCtx.currentTime, 0.05)
    }
  } catch { /**/ }
}

export function setNoisevolume(v: number) {
  if (_noiseGain && _noiseCtx) _noiseGain.gain.setTargetAtTime(v, _noiseCtx.currentTime, 0.1)
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const PomodoroContext = createContext<PomodoroContextValue | null>(null)

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsStored] = useLocalStorage<PomodoroSettings>('pomodoro-settings', DEFAULT_SETTINGS)
  const [phase, setPhase] = useState<Phase>('work')
  const [sessionsDone, setSessionsDone] = useState(0)
  const [running, setRunning] = useState(false)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(settings.workMin * 60)
  const [noiseOn, setNoiseOn] = useState(false)
  const [noiseVol, setNoiseVolState] = useState(0.04)
  const [noiseType, setNoiseTypeState] = useState<NoiseType>('white')
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function phaseSeconds(p: Phase, s = settings) {
    return (p === 'work' ? s.workMin : p === 'short' ? s.shortMin : s.longMin) * 60
  }

  // ── Completion handler ───────────────────────────────────────────────────
  const handleComplete = useCallback(
    (completedPhase: Phase) => {
      setRunning(false)
      setEndTime(null)
      if (completedPhase === 'work') {
        playWorkComplete()
        setSessionsDone((prev) => {
          const next = prev + 1
          const nextPhase: Phase = next % settings.sessionsBeforeLong === 0 ? 'long' : 'short'
          setTimeout(() => {
            playWhoosh()
            setPhase(nextPhase)
            setTimeLeft(phaseSeconds(nextPhase))
          }, 600)
          return next
        })
      } else {
        playBreakComplete()
        setTimeout(() => {
          playWhoosh()
          setPhase('work')
          setTimeLeft(phaseSeconds('work'))
        }, 600)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings]
  )

  // ── Tick ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!running || endTime === null) {
      if (tickRef.current) clearInterval(tickRef.current)
      return
    }
    tickRef.current = setInterval(() => {
      const left = (endTime - Date.now()) / 1000
      if (left <= 0) {
        setTimeLeft(0)
        clearInterval(tickRef.current!)
        handleComplete(phase)
      } else {
        setTimeLeft(left)
      }
    }, 250)
    return () => clearInterval(tickRef.current!)
  }, [running, endTime, phase, handleComplete])

  // Sync on tab focus
  useEffect(() => {
    const onVisible = () => {
      if (running && endTime !== null) {
        const left = (endTime - Date.now()) / 1000
        if (left <= 0) { setTimeLeft(0); handleComplete(phase) }
        else setTimeLeft(left)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [running, endTime, phase, handleComplete])

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleRun = useCallback(() => {
    playClick()
    setRunning((r) => {
      if (r) {
        if (tickRef.current) clearInterval(tickRef.current)
        setEndTime(null)
        return false
      }
      setEndTime(Date.now() + timeLeft * 1000)
      return true
    })
  }, [timeLeft])

  const reset = useCallback(() => {
    playClick()
    if (tickRef.current) clearInterval(tickRef.current)
    setRunning(false)
    setEndTime(null)
    setTimeLeft(phaseSeconds(phase))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, settings])

  const switchPhase = useCallback((p: Phase) => {
    playClick()
    if (tickRef.current) clearInterval(tickRef.current)
    setRunning(false); setEndTime(null)
    setPhase(p); setTimeLeft(phaseSeconds(p))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  // ── Settings ──────────────────────────────────────────────────────────────
  const setSettings = useCallback((s: PomodoroSettings) => {
    setSettingsStored(s)
    if (tickRef.current) clearInterval(tickRef.current)
    setRunning(false); setEndTime(null)
    setPhase('work'); setSessionsDone(0)
    setTimeLeft(s.workMin * 60)
  }, [setSettingsStored])

  // ── Ambient noise ─────────────────────────────────────────────────────────
  const toggleNoise = useCallback(() => {
    playClick()
    setNoiseOn((on) => {
      if (on) { stopNoise(); return false }
      startNoise(noiseVol, noiseType); return true
    })
  }, [noiseVol, noiseType])

  const handleSetNoiseVol = useCallback((v: number) => {
    setNoiseVolState(v)
    if (noiseOn) setNoisevolume(v)
  }, [noiseOn])

  const handleSetNoiseType = useCallback((t: NoiseType) => {
    setNoiseTypeState(t)
    setNoiseOn((on) => {
      if (on) {
        // Restart with new type — tear down current graph, build new one
        stopNoise()
        // Small delay so gain ramps to 0 before we rebuild
        setTimeout(() => startNoise(noiseVol, t), 120)
      }
      return on
    })
  }, [noiseVol])

  return (
    <PomodoroContext.Provider value={{
      settings, setSettings,
      phase, timeLeft, running, sessionsDone,
      noiseOn, noiseVol, noiseType,
      toggleRun, reset, switchPhase,
      toggleNoise, setNoiseVol: handleSetNoiseVol, setNoiseType: handleSetNoiseType,
    }}>
      {children}
    </PomodoroContext.Provider>
  )
}

export function usePomodoroContext() {
  const ctx = useContext(PomodoroContext)
  if (!ctx) throw new Error('usePomodoroContext must be used inside PomodoroProvider')
  return ctx
}
