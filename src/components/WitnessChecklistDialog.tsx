'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WitnessChecklistPanel } from './WitnessChecklistPanel'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface WitnessChecklistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  witnessId: string
  witnessName: string
  pollingStationName: string
}

export function WitnessChecklistDialog({
  open,
  onOpenChange,
  witnessId,
  witnessName,
  pollingStationName
}: WitnessChecklistDialogProps) {
  const [checklist, setChecklist] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  const fetchChecklist = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/leader/witnesses/${witnessId}/checklist`)
      const data = await response.json()

      if (data.success) {
        setChecklist(data.data)
        setHasChanges(true) // Marcar que hubo cambios
      } else {
        toast.error('Error al cargar checklist')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchChecklist()
      setHasChanges(false)
    }
  }, [open, witnessId])

  // Cuando se cierra el diálogo, notificar cambios
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasChanges) {
      // Recargar la página padre después de un pequeño delay
      setTimeout(() => {
        window.location.reload()
      }, 300)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Checklist del Día Electoral</DialogTitle>
          <DialogDescription>
            Seguimiento de actividades del testigo electoral
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : checklist ? (
          <WitnessChecklistPanel
            witnessId={witnessId}
            witnessName={witnessName}
            pollingStationName={pollingStationName}
            checklist={checklist}
            onUpdate={fetchChecklist}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No se pudo cargar el checklist
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
