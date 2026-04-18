import type { Day } from '../types'
import type { WorkoutDay } from '../types/workout'

export interface BackupPayload {
  version: 1
  exportedAt: string
  tasks: Day[]
  workouts: WorkoutDay[]
}

export function downloadBackup(tasks: Day[], workouts: WorkoutDay[]) {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    workouts,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  a.href = url
  a.download = `organizer-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function readBackupFile(file: File): Promise<BackupPayload> {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!data || typeof data !== 'object' || data.version !== 1) {
    throw new Error('Arquivo inválido — formato não reconhecido')
  }
  if (!Array.isArray(data.tasks) || !Array.isArray(data.workouts)) {
    throw new Error('Arquivo inválido — conteúdo ausente')
  }
  return data as BackupPayload
}
