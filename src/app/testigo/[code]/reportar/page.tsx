'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Loader2, 
  Shield, 
  ArrowLeft, 
  Save, 
  CheckCircle,
  AlertTriangle,
  FileText,
  Lock,
  Wifi,
  WifiOff,
  CloudOff,
  Upload
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { offlineStorage } from '@/lib/offline-storage'

interface WitnessData {
  id: string
  voter: {
    name: string
  }
  pollingStation: {
    name: string
  }
  assignedTables: number[]
}

interface TableReport {
  id: string
  number: number
  votesRegistered?: number
  votesCandidate?: number
  votesBlank?: number
  votesNull?: number
  totalVotes?: number
  observations?: string
  hasIrregularities: boolean
  irregularityType?: string
  irregularityDetails?: string
  reportedAt?: string
}

export default function WitnessReportFormPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [witness, setWitness] = useState<WitnessData | null>(null)
  const [reports, setReports] = useState<TableReport[]>([])
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const isOnline = useOnlineStatus()
  const [pendingSync, setPendingSync] = useState(0)

  // Form state
  const [votesRegistered, setVotesRegistered] = useState('')
  const [votesCandidate, setVotesCandidate] = useState('')
  const [votesBlank, setVotesBlank] = useState('')
  const [votesNull, setVotesNull] = useState('')
  const [observations, setObservations] = useState('')
  const [hasIrregularities, setHasIrregularities] = useState(false)
  const [irregularityType, setIrregularityType] = useState('')
  const [irregularityDetails, setIrregularityDetails] = useState('')

  useEffect(() => {
    fetchData()
    checkPendingReports()
  }, [code])

  useEffect(() => {
    if (selectedTable !== null) {
      loadTableData(selectedTable)
    }
  }, [selectedTable, reports])

  // Sincronizar cuando se recupere la conexión
  useEffect(() => {
    if (isOnline && pendingSync > 0) {
      syncPendingReports()
    }
  }, [isOnline])

  const checkPendingReports = async () => {
    try {
      const pending = await offlineStorage.getPendingReports()
      setPendingSync(pending.length)
    } catch (error) {
      console.error('Error checking pending reports:', error)
    }
  }

  const syncPendingReports = async () => {
    try {
      toast.info('Sincronizando reportes pendientes...')
      const result = await offlineStorage.syncPendingReports()
      
      if (result.success > 0) {
        toast.success(`✅ ${result.success} reportes sincronizados`)
        setPendingSync(result.failed)
        await fetchData()
      }
      
      if (result.failed > 0) {
        toast.error(`⚠️ ${result.failed} reportes no se pudieron sincronizar`)
      }
    } catch (error) {
      console.error('Error syncing reports:', error)
      toast.error('Error al sincronizar reportes')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Obtener datos del testigo
      const witnessResponse = await fetch(`/api/witness/auth?code=${code}`)
      const witnessData = await witnessResponse.json()

      if (!witnessData.success) {
        toast.error('Código inválido')
        router.push('/')
        return
      }

      setWitness(witnessData.data)

      // Obtener reportes existentes
      const reportsResponse = await fetch(`/api/witness/report?code=${code}`)
      const reportsData = await reportsResponse.json()

      if (reportsData.success) {
        setReports(reportsData.data)
      }
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const loadTableData = (tableNumber: number) => {
    const report = reports.find(r => r.number === tableNumber)
    
    if (report) {
      setVotesRegistered(report.votesRegistered?.toString() || '')
      setVotesCandidate(report.votesCandidate?.toString() || '')
      setVotesBlank(report.votesBlank?.toString() || '')
      setVotesNull(report.votesNull?.toString() || '')
      setObservations(report.observations || '')
      setHasIrregularities(report.hasIrregularities)
      setIrregularityType(report.irregularityType || '')
      setIrregularityDetails(report.irregularityDetails || '')
    } else {
      // Limpiar formulario
      setVotesRegistered('')
      setVotesCandidate('')
      setVotesBlank('')
      setVotesNull('')
      setObservations('')
      setHasIrregularities(false)
      setIrregularityType('')
      setIrregularityDetails('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedTable === null) {
      toast.error('Selecciona una mesa')
      return
    }

    // Validaciones
    const registered = parseInt(votesRegistered) || 0
    const candidate = parseInt(votesCandidate) || 0
    const blank = parseInt(votesBlank) || 0
    const nullVotes = parseInt(votesNull) || 0

    if (registered < 0 || candidate < 0 || blank < 0 || nullVotes < 0) {
      toast.error('Los números no pueden ser negativos')
      return
    }

    if (candidate > registered) {
      toast.error('Los votos del candidato no pueden superar los votos registrados')
      return
    }

    // Verificar si ya está reportada
    const existingReport = reports.find(r => r.number === selectedTable)
    if (existingReport && existingReport.reportedAt) {
      toast.error('Esta mesa ya fue reportada y no puede modificarse')
      return
    }

    // Mostrar diálogo de confirmación
    setShowConfirmDialog(true)
  }

  const confirmAndSave = async () => {
    setShowConfirmDialog(false)
    setSaving(true)

    try {
      const registered = parseInt(votesRegistered) || 0
      const candidate = parseInt(votesCandidate) || 0
      const blank = parseInt(votesBlank) || 0
      const nullVotes = parseInt(votesNull) || 0

      const existingReport = reports.find(r => r.number === selectedTable)

      const reportData = {
        code,
        reportId: existingReport?.id,
        tableNumber: selectedTable,
        votesRegistered: registered,
        votesCandidate: candidate,
        votesBlank: blank,
        votesNull: nullVotes,
        observations,
        hasIrregularities,
        irregularityType: hasIrregularities ? irregularityType : null,
        irregularityDetails: hasIrregularities ? irregularityDetails : null
      }

      // Si no hay conexión, guardar offline
      if (!isOnline) {
        await offlineStorage.savePendingReport({
          type: 'table',
          data: reportData
        })
        
        toast.success('📱 Reporte guardado offline. Se sincronizará cuando haya conexión.')
        setPendingSync(prev => prev + 1)
        
        // Actualizar UI localmente
        setSelectedTable(null)
        return
      }

      // Si hay conexión, enviar normalmente
      const response = await fetch('/api/witness/report', {
        method: existingReport ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Reporte guardado exitosamente')
        await fetchData()
        setSelectedTable(null)
      } else {
        // Si falla el envío, guardar offline como respaldo
        await offlineStorage.savePendingReport({
          type: 'table',
          data: reportData
        })
        toast.warning('⚠️ Error al enviar. Reporte guardado offline para sincronizar después.')
        setPendingSync(prev => prev + 1)
      }
    } catch (error) {
      // Si hay error de red, guardar offline
      try {
        const registered = parseInt(votesRegistered) || 0
        const candidate = parseInt(votesCandidate) || 0
        const blank = parseInt(votesBlank) || 0
        const nullVotes = parseInt(votesNull) || 0
        const existingReport = reports.find(r => r.number === selectedTable)

        await offlineStorage.savePendingReport({
          type: 'table',
          data: {
            code,
            reportId: existingReport?.id,
            tableNumber: selectedTable,
            votesRegistered: registered,
            votesCandidate: candidate,
            votesBlank: blank,
            votesNull: nullVotes,
            observations,
            hasIrregularities,
            irregularityType: hasIrregularities ? irregularityType : null,
            irregularityDetails: hasIrregularities ? irregularityDetails : null
          }
        })
        
        toast.warning('📱 Sin conexión. Reporte guardado offline.')
        setPendingSync(prev => prev + 1)
      } catch (offlineError) {
        toast.error('Error al guardar el reporte')
      }
    } finally {
      setSaving(false)
    }
  }

  const calculateTotal = () => {
    const registered = parseInt(votesRegistered) || 0
    const blank = parseInt(votesBlank) || 0
    const nullVotes = parseInt(votesNull) || 0
    return registered + blank + nullVotes
  }

  const getTableStatus = (tableNumber: number) => {
    const report = reports.find(r => r.number === tableNumber)
    if (!report || !report.reportedAt) return 'pending'
    return 'reported'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!witness) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/10 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/testigo/${code}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Checklist
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Reporte de Mesas</h1>
            
            {/* Indicador de Conexión */}
            <div className="ml-auto flex items-center gap-2">
              {!isOnline && (
                <Badge variant="destructive" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  Sin conexión
                </Badge>
              )}
              {isOnline && (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <Wifi className="h-3 w-3" />
                  En línea
                </Badge>
              )}
              {pendingSync > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <CloudOff className="h-3 w-3" />
                  {pendingSync} pendiente{pendingSync > 1 ? 's' : ''}
                </Badge>
              )}
              {isOnline && pendingSync > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={syncPendingReports}
                  className="gap-1"
                >
                  <Upload className="h-3 w-3" />
                  Sincronizar
                </Button>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">
            {witness.voter.name} - {witness.pollingStation.name}
          </p>
          
          {/* Mensaje de modo offline */}
          {!isOnline && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Modo Sin Conexión</p>
                  <p>Los reportes se guardarán en tu dispositivo y se sincronizarán automáticamente cuando recuperes la conexión.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selección de Mesa */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selecciona la Mesa a Reportar</CardTitle>
            <CardDescription>
              Mesas asignadas: {witness.assignedTables.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {witness.assignedTables.map(table => {
                const status = getTableStatus(table)
                const isSelected = selectedTable === table

                return (
                  <Button
                    key={table}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`h-20 flex flex-col gap-2 ${
                      status === 'reported' && !isSelected ? 'border-green-500 bg-green-50' : ''
                    }`}
                    onClick={() => setSelectedTable(table)}
                  >
                    <span className="text-2xl font-bold">Mesa {table}</span>
                    {status === 'reported' && (
                      <Badge variant="outline" className="text-xs bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Reportada
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Formulario de Reporte */}
        {selectedTable !== null && (
          <>
            {/* Verificar si ya está reportada */}
            {getTableStatus(selectedTable) === 'reported' ? (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <Lock className="h-5 w-5" />
                    Mesa {selectedTable} - Reporte Bloqueado
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Esta mesa ya fue reportada y no puede modificarse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const report = reports.find(r => r.number === selectedTable)
                    if (!report) return null
                    
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-green-900">Votos Registrados</p>
                            <p className="text-2xl font-bold text-green-700">{report.votesRegistered || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-900">Votos Alonso del Río</p>
                            <p className="text-2xl font-bold text-green-700">{report.votesCandidate || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-900">Votos en Blanco</p>
                            <p className="text-2xl font-bold text-green-700">{report.votesBlank || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-900">Votos Nulos</p>
                            <p className="text-2xl font-bold text-green-700">{report.votesNull || 0}</p>
                          </div>
                        </div>
                        
                        {report.observations && (
                          <div>
                            <p className="text-sm font-medium text-green-900 mb-1">Observaciones</p>
                            <p className="text-sm text-green-700">{report.observations}</p>
                          </div>
                        )}
                        
                        {report.hasIrregularities && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                            <p className="text-sm font-medium text-amber-900 mb-1">
                              ⚠️ Irregularidad Reportada
                            </p>
                            {report.irregularityType && (
                              <p className="text-sm text-amber-700 mb-1">
                                <strong>Tipo:</strong> {report.irregularityType}
                              </p>
                            )}
                            {report.irregularityDetails && (
                              <p className="text-sm text-amber-700">
                                <strong>Detalles:</strong> {report.irregularityDetails}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="pt-3 border-t border-green-200">
                          <p className="text-xs text-green-600">
                            ✅ Reportado el {new Date(report.reportedAt!).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Datos de la Mesa {selectedTable}
                </CardTitle>
                <CardDescription>
                  Ingresa los datos del acta electoral
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Votos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="votesRegistered">
                      Votos Registrados en el Acta *
                    </Label>
                    <Input
                      id="votesRegistered"
                      type="number"
                      min="0"
                      value={votesRegistered}
                      onChange={(e) => setVotesRegistered(e.target.value)}
                      required
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="votesCandidate">
                      Votos para Alonso del Río *
                    </Label>
                    <Input
                      id="votesCandidate"
                      type="number"
                      min="0"
                      value={votesCandidate}
                      onChange={(e) => setVotesCandidate(e.target.value)}
                      required
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="votesBlank">Votos en Blanco</Label>
                    <Input
                      id="votesBlank"
                      type="number"
                      min="0"
                      value={votesBlank}
                      onChange={(e) => setVotesBlank(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="votesNull">Votos Nulos</Label>
                    <Input
                      id="votesNull"
                      type="number"
                      min="0"
                      value={votesNull}
                      onChange={(e) => setVotesNull(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Total Calculado */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Calculado:</span>
                    <span className="text-2xl font-bold">{calculateTotal()}</span>
                  </div>
                </div>

                {/* Irregularidades */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="irregularities">
                        ¿Hubo irregularidades?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Marca si observaste alguna irregularidad
                      </p>
                    </div>
                    <Switch
                      id="irregularities"
                      checked={hasIrregularities}
                      onCheckedChange={setHasIrregularities}
                    />
                  </div>

                  {hasIrregularities && (
                    <div className="space-y-4 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">Detalles de Irregularidad</span>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="irregularityType">Tipo de Irregularidad</Label>
                        <Input
                          id="irregularityType"
                          value={irregularityType}
                          onChange={(e) => setIrregularityType(e.target.value)}
                          placeholder="Ej: Retraso en apertura, falta de material, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="irregularityDetails">Descripción Detallada</Label>
                        <Textarea
                          id="irregularityDetails"
                          value={irregularityDetails}
                          onChange={(e) => setIrregularityDetails(e.target.value)}
                          placeholder="Describe lo que observaste..."
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Observaciones */}
                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones Adicionales</Label>
                  <Textarea
                    id="observations"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Cualquier observación adicional sobre el proceso..."
                    rows={3}
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Reporte
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
            )}
          </>
        )}

        {/* Diálogo de Confirmación */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                ¿Confirmar Datos del Reporte?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Por favor verifica que los datos sean correctos antes de guardar.
                  <strong className="block mt-2 text-foreground">
                    Una vez guardado, NO podrás modificar este reporte.
                  </strong>
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <p className="font-medium text-blue-900 mb-2">Mesa {selectedTable}:</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Votos Registrados: <strong>{votesRegistered || 0}</strong></li>
                    <li>• Votos Alonso del Río: <strong>{votesCandidate || 0}</strong></li>
                    <li>• Votos en Blanco: <strong>{votesBlank || 0}</strong></li>
                    <li>• Votos Nulos: <strong>{votesNull || 0}</strong></li>
                    <li>• Total: <strong>{calculateTotal()}</strong></li>
                    {hasIrregularities && (
                      <li className="text-amber-700">• ⚠️ Con irregularidades reportadas</li>
                    )}
                  </ul>
                </div>
                
                <p className="text-sm font-medium text-red-600">
                  ¿Estás seguro de que los datos son correctos?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar y Revisar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAndSave}>
                Sí, Guardar Reporte
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
