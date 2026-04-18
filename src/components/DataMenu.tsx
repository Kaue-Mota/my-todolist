import { useRef } from 'react'
import { Download, Upload, Trash2 } from 'lucide-react'
import { useTasksContext, useWorkoutContext } from '../context/DataContext'
import { useToast } from './ToastProvider'
import { useConfirm } from './ConfirmProvider'
import { downloadBackup, readBackupFile } from '../utils/exportImport'

interface Props {
  onClose: () => void
}

export function DataMenu({ onClose }: Props) {
  const { days: taskDays, restoreSnapshot: restoreTasks } = useTasksContext()
  const { days: workoutDays, restoreSnapshot: restoreWorkouts } = useWorkoutContext()
  const toast = useToast()
  const confirm = useConfirm()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    downloadBackup(taskDays, workoutDays)
    toast.show('Backup baixado', { tone: 'success' })
    onClose()
  }

  async function handleImport(file: File) {
    try {
      const payload = await readBackupFile(file)
      const ok = await confirm({
        title: 'Importar backup?',
        message: 'Seus dados atuais serão substituídos pelo conteúdo do arquivo.',
        confirmLabel: 'Importar',
        destructive: true,
      })
      if (!ok) return
      const prevTasks = taskDays
      const prevWorkouts = workoutDays
      restoreTasks(payload.tasks)
      restoreWorkouts(payload.workouts)
      toast.show('Backup importado', {
        tone: 'success',
        action: {
          label: 'Desfazer',
          onClick: () => {
            restoreTasks(prevTasks)
            restoreWorkouts(prevWorkouts)
          },
        },
      })
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível importar'
      toast.show(msg, { tone: 'error' })
    }
  }

  async function handleClearAll() {
    const ok = await confirm({
      title: 'Apagar todos os dados?',
      message: 'Todas as tarefas e treinos serão removidos. Esta ação não pode ser desfeita facilmente — considere exportar um backup primeiro.',
      confirmLabel: 'Apagar tudo',
      destructive: true,
    })
    if (!ok) return
    const prevTasks = taskDays
    const prevWorkouts = workoutDays
    restoreTasks([])
    restoreWorkouts([])
    toast.show('Dados apagados', {
      tone: 'error',
      duration: 8000,
      action: {
        label: 'Desfazer',
        onClick: () => {
          restoreTasks(prevTasks)
          restoreWorkouts(prevWorkouts)
        },
      },
    })
    onClose()
  }

  return (
    <div
      className="w-56 bg-gray-900 border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleExport}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/75 hover:bg-white/5 hover:text-white/95 transition-colors"
      >
        <Download size={14} className="text-indigo-400" />
        Exportar backup
      </button>

      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/75 hover:bg-white/5 hover:text-white/95 transition-colors"
      >
        <Upload size={14} className="text-violet-400" />
        Importar backup
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImport(file)
          e.target.value = ''
        }}
      />

      <div className="my-1 h-px bg-white/5" />

      <button
        onClick={handleClearAll}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/75 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
      >
        <Trash2 size={14} className="text-rose-400" />
        Apagar tudo
      </button>
    </div>
  )
}
