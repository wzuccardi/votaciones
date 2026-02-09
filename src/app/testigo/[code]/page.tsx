'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Check, Clock, Loader2, Shield, MapPin, AlertCircle, FileText } from 'lucide-react'

interface WitnessData {
  id: string
  voter: {
    name: string
    document: string
  }
  pollingStation: {
    name: string
    address?: string
    community?: string
  }
  assignedTables: number[]
  confirmedAttendance: boolean
  receivedCredential: boolean
  arrivedAtStation: boolean
  reportedVotingStart: boolean
  reportedVotingEnd: boolean
  deliveredAct: boolean
  arrivedAt?: string
  votingStartAt?: string
  votingEndAt?: string
  actDeliveredAt?: string
}

interface ChecklistAction {
  field: string
  label: string
  icon: string
  description: string
  color: string
}

const checklistActions: ChecklistAction[] = [
  {
    field: 'confirmedAttendance',
    label: 'Confirmar Asistencia',
    icon: '✅',
    description: 'Confirmo que asistiré como testigo electoral',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    field: 'arrivedAtStation',
    label: 'He Llegado al Puesto',
    icon: '📍',
    description: 'Ya estoy en el puesto de votación',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    field: 'reportedVotingStart',
    label: 'Inició la Votación',
    icon: '🗳️',
    description: 'La votación ha comenzado',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    field: 'reportedVotingEnd',
    label: 'Cerró la Votación',
    icon: '🔒',
    description: 'La votación ha finalizado',
    color: 'bg-orange-500 hover:bg-orange-600'
  },
  {
    field: 'deliveredAct',
    label: 'Entregué el Acta',
    icon: '📄',
    description: 'He entregado el acta electoral',
    color: 'bg-red-500 hover:bg-red-600'
  }
]

export default function WitnessReportPage() {
  const params = useParams()
  const code = params.code as string

  const [witness, setWitness] = useState<WitnessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWitnessData()
  }, [code])

  const fetchWitnessData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/witness/auth?code=${code}`)
      const data = await response.json()

      if (data.success) {
        setWitness(data.data)
      } else {
        setError(data.error || 'Código inválido')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (field: string) => {
    if (!witness) return

    setUpdating(field)
    try {
      const response = await fetch(`/api/witness/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          field,
          value: true
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('¡Actualizado correctamente!')
        fetchWitnessData()
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setUpdating(null)
    }
  }

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (error || !witness) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Código Inválido</CardTitle>
            </div>
            <CardDescription>
              El código proporcionado no es válido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Por favor, verifica el código con tu coordinador de campaña.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedCount = [
    witness.confirmedAttendance,
    witness.arrivedAtStation,
    witness.reportedVotingStart,
    witness.reportedVotingEnd,
    witness.deliveredAct
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Testigo Electoral</h1>
          <p className="text-muted-foreground">Sistema de Auto-Reporte</p>
        </div>

        {/* Información del Testigo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {witness.voter.name}
            </CardTitle>
            <CardDescription>CC: {witness.voter.document}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <MapPin className="h-4 w-4" />
                Puesto de Votación
              </div>
              <p className="text-sm text-muted-foreground">
                {witness.pollingStation.name}
              </p>
              {witness.pollingStation.address && (
                <p className="text-xs text-muted-foreground mt-1">
                  {witness.pollingStation.address}
                </p>
              )}
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Mesas Asignadas</div>
              <div className="flex flex-wrap gap-2">
                {witness.assignedTables.map(table => (
                  <Badge key={table} variant="outline">
                    Mesa {table}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Progreso del Día</span>
                <span className="text-muted-foreground">
                  {completedCount}/5 completado
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-300"
                  style={{ width: `${(completedCount / 5) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones del Checklist */}
        <div className="space-y-4">
          {checklistActions.map((action) => {
            const isCompleted = witness[action.field as keyof WitnessData] as boolean
            const timestamp = 
              action.field === 'arrivedAtStation' ? witness.arrivedAt :
              action.field === 'reportedVotingStart' ? witness.votingStartAt :
              action.field === 'reportedVotingEnd' ? witness.votingEndAt :
              action.field === 'deliveredAct' ? witness.actDeliveredAt :
              null

            return (
              <Card key={action.field} className={isCompleted ? 'border-green-200 bg-green-50' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-4xl">{action.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {action.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                        {timestamp && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-green-700">
                            <Clock className="h-3 w-3" />
                            <span>Reportado a las {formatTime(timestamp)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isCompleted ? (
                      <Badge variant="default" className="bg-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        Completado
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => handleAction(action.field)}
                        disabled={updating === action.field}
                        className={action.color}
                        size="lg"
                      >
                        {updating === action.field ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Reportando...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Reportar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mensaje de Completado */}
        {completedCount === 5 && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-bold text-green-900 mb-2">
                ¡Excelente Trabajo!
              </h3>
              <p className="text-green-700">
                Has completado todas las actividades del día electoral.
                ¡Gracias por tu compromiso!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Botón de Reporte de Mesas */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Reportar Resultados de Mesas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ingresa los votos de las mesas asignadas
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => window.location.href = `/testigo/${code}/reportar`}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-5 w-5 mr-2" />
                Ir a Reportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Sistema de Gestión Electoral</p>
          <p className="mt-1">Código de testigo: {code}</p>
        </div>
      </div>
    </div>
  )
}
