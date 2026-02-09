'use client'

import { useState } from 'react'
import { Check, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ChecklistItem {
  field: string
  label: string
  timestamp?: Date | null
  completed: boolean
}

interface WitnessChecklistPanelProps {
  witnessId: string
  witnessName: string
  pollingStationName: string
  checklist: {
    confirmedAttendance: boolean
    receivedCredential: boolean
    arrivedAtStation: boolean
    reportedVotingStart: boolean
    reportedVotingEnd: boolean
    deliveredAct: boolean
    arrivedAt?: Date | null
    votingStartAt?: Date | null
    votingEndAt?: Date | null
    actDeliveredAt?: Date | null
  }
  onUpdate?: () => void
}

export function WitnessChecklistPanel({
  witnessId,
  witnessName,
  pollingStationName,
  checklist,
  onUpdate
}: WitnessChecklistPanelProps) {
  const [updating, setUpdating] = useState<string | null>(null)

  const checklistItems: ChecklistItem[] = [
    {
      field: 'confirmedAttendance',
      label: 'Confirmó asistencia',
      completed: checklist.confirmedAttendance,
      timestamp: null
    },
    {
      field: 'receivedCredential',
      label: 'Recibió credencial',
      completed: checklist.receivedCredential,
      timestamp: null
    },
    {
      field: 'arrivedAtStation',
      label: 'Llegó al puesto',
      completed: checklist.arrivedAtStation,
      timestamp: checklist.arrivedAt
    },
    {
      field: 'reportedVotingStart',
      label: 'Reportó inicio de votación',
      completed: checklist.reportedVotingStart,
      timestamp: checklist.votingStartAt
    },
    {
      field: 'reportedVotingEnd',
      label: 'Reportó cierre de votación',
      completed: checklist.reportedVotingEnd,
      timestamp: checklist.votingEndAt
    },
    {
      field: 'deliveredAct',
      label: 'Entregó acta',
      completed: checklist.deliveredAct,
      timestamp: checklist.actDeliveredAt
    }
  ]

  const completedCount = checklistItems.filter(item => item.completed).length
  const totalCount = checklistItems.length
  const progressPercentage = Math.round((completedCount / totalCount) * 100)

  const handleToggle = async (field: string, currentValue: boolean) => {
    setUpdating(field)
    try {
      const response = await fetch(`/api/dashboard/leader/witnesses/${witnessId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: !currentValue })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Checklist actualizado')
        onUpdate?.()
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{witnessName}</CardTitle>
            <CardDescription>{pollingStationName}</CardDescription>
          </div>
          <Badge variant={progressPercentage === 100 ? 'default' : 'secondary'}>
            {completedCount}/{totalCount}
          </Badge>
        </div>
        
        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {checklistItems.map((item) => (
          <div
            key={item.field}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <Button
                variant={item.completed ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleToggle(item.field, item.completed)}
                disabled={updating === item.field}
              >
                {updating === item.field ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : item.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4" />
                )}
              </Button>

              <div className="flex-1">
                <p className={`text-sm font-medium ${item.completed ? 'text-muted-foreground line-through' : ''}`}>
                  {item.label}
                </p>
                {item.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {format(new Date(item.timestamp), "d 'de' MMMM, HH:mm", { locale: es })}
                  </p>
                )}
              </div>
            </div>

            {item.completed && (
              <Badge variant="outline" className="ml-2">
                <Check className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            )}
          </div>
        ))}

        {progressPercentage === 100 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">¡Checklist completado!</span>
            </div>
          </div>
        )}

        {progressPercentage < 50 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Pendiente de completar varios pasos</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
