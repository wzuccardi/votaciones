'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Check, Clock, X } from 'lucide-react'

interface WitnessChecklistProps {
  witnessId: string
  witnessName: string
  pollingStation: string
  checklist: {
    confirmedAttendance: boolean
    receivedCredential: boolean
    arrivedAtStation: boolean
    reportedVotingStart: boolean
    reportedVotingEnd: boolean
    deliveredAct: boolean
  }
  timestamps?: {
    arrivedAt?: string
    votingStartAt?: string
    votingEndAt?: string
    actDeliveredAt?: string
  }
  onUpdate?: () => void
  readOnly?: boolean
}

interface ChecklistItem {
  field: string
  label: string
  icon: string
  timestampField?: string
}

const checklistItems: ChecklistItem[] = [
  { field: 'confirmedAttendance', label: 'Confirmó asistencia', icon: '📋' },
  { field: 'receivedCredential', label: 'Recibió credencial', icon: '🎫' },
  { field: 'arrivedAtStation', label: 'Llegó al puesto', icon: '📍', timestampField: 'arrivedAt' },
  { field: 'reportedVotingStart', label: 'Reportó inicio de votación', icon: '🗳️', timestampField: 'votingStartAt' },
  { field: 'reportedVotingEnd', label: 'Reportó cierre de votación', icon: '🔒', timestampField: 'votingEndAt' },
  { field: 'deliveredAct', label: 'Entregó acta', icon: '📄', timestampField: 'actDeliveredAt' }
]

export function WitnessChecklist({
  witnessId,
  witnessName,
  pollingStation,
  checklist,
  timestamps,
  onUpdate,
  readOnly = false
}: WitnessChecklistProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [localChecklist, setLocalChecklist] = useState(checklist)
  const [localTimestamps, setLocalTimestamps] = useState(timestamps)

  // Actualizar estado local cuando cambien los props
  useEffect(() => {
    setLocalChecklist(checklist)
    setLocalTimestamps(timestamps)
  }, [checklist, timestamps])

  const handleToggle = async (field: string, currentValue: boolean) => {
    if (readOnly) return

    setUpdating(field)
    try {
      const response = await fetch(`/api/dashboard/leader/witnesses/${witnessId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field,
          value: !currentValue
        })
      })

      const data = await response.json()
      if (data.success) {
        // Actualizar estado local inmediatamente
        setLocalChecklist(prev => ({
          ...prev,
          [field]: !currentValue
        }))
        
        // Si se marcó como true, agregar timestamp
        if (!currentValue) {
          const now = new Date().toISOString()
          if (field === 'arrivedAtStation') {
            setLocalTimestamps(prev => ({ ...prev, arrivedAt: now }))
          } else if (field === 'reportedVotingStart') {
            setLocalTimestamps(prev => ({ ...prev, votingStartAt: now }))
          } else if (field === 'reportedVotingEnd') {
            setLocalTimestamps(prev => ({ ...prev, votingEndAt: now }))
          } else if (field === 'deliveredAct') {
            setLocalTimestamps(prev => ({ ...prev, actDeliveredAt: now }))
          }
        }
        
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

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const completedCount = Object.values(localChecklist).filter(Boolean).length
  const totalCount = checklistItems.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{witnessName}</CardTitle>
            <CardDescription>{pollingStation}</CardDescription>
          </div>
          <Badge 
            variant={progressPercent === 100 ? "default" : progressPercent > 50 ? "secondary" : "outline"}
            className="text-sm"
          >
            {completedCount}/{totalCount} ({progressPercent}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checklistItems.map((item) => {
            const isChecked = localChecklist[item.field as keyof typeof localChecklist]
            const timestamp = localTimestamps?.[item.timestampField as keyof typeof localTimestamps]
            const isUpdating = updating === item.field

            return (
              <div
                key={item.field}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                  isChecked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center h-6">
                  {!readOnly ? (
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggle(item.field, isChecked)}
                      disabled={isUpdating}
                      className="mt-0.5"
                    />
                  ) : (
                    <div className="w-5 h-5 flex items-center justify-center">
                      {isChecked ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <label
                      className={`text-sm font-medium cursor-pointer ${
                        isChecked ? 'text-green-900' : 'text-gray-700'
                      }`}
                    >
                      {item.label}
                    </label>
                  </div>
                  {timestamp && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(timestamp)}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {progressPercent === 100 && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-sm text-green-800 font-medium text-center">
              ✅ Checklist completado - ¡Excelente trabajo!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
