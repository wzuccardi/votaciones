'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WitnessChecklist } from '@/components/WitnessChecklist'
import {
  Shield,
  LogOut,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  MapPin,
  Search,
  FileText,
  Phone,
  Smartphone,
  Mail,
  Star,
  Clock,
  Car,
  AlertCircle,
  XCircle,
  UserCheck,
  ClipboardCheck,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { generateWitnessPlan, generateCoverageReport } from '@/lib/pdf-generator-witnesses'

interface ElectoralWitness {
  id: string
  voter: {
    id: string
    document: string
    name: string
    tel?: string
    celular?: string
    email?: string
    tableNumber?: string
  }
  pollingStation: {
    id: string
    name: string
    code: string
    address?: string
    community?: string
  }
  assignedTables: number[]
  status: 'ASSIGNED' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  experience: 'FIRST_TIME' | 'EXPERIENCED'
  availability: 'FULL_DAY' | 'MORNING' | 'AFTERNOON'
  hasTransport: boolean
  emergencyContact?: string
  notes?: string
  confirmedAt?: string
  createdAt: string
  updatedAt: string
}

interface Candidate {
  id: string
  name: string
  party: string
  primaryColor?: string | null
  secondaryColor?: string | null
  logoUrl?: string | null
  photoUrl?: string | null
}

export default function WitnessesPage() {
  const { data: session, status } = useSession()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [witnesses, setWitnesses] = useState<ElectoralWitness[]>([])
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [selectedWitnessForChecklist, setSelectedWitnessForChecklist] = useState<ElectoralWitness | null>(null)
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    if (isRedirecting) return
    if (status === 'authenticated' && session?.user) {
      setCurrentUser(session.user)
      fetchData((session.user as any).id)
    } else if (status === 'unauthenticated') {
      setIsRedirecting(true)
      window.location.href = '/login'
    }
  }, [status, session, isRedirecting])

  const fetchData = async (leaderId: string) => {
    try {
      setIsLoading(true)

      // Fetch witnesses
      const witnessesResponse = await fetch(`/api/dashboard/leader/witnesses?leaderId=${leaderId}`)
      if (witnessesResponse.ok) {
        const witnessesData = await witnessesResponse.json()
        setWitnesses(witnessesData.data || [])
      }

      // Fetch candidate info
      const candidateResponse = await fetch(`/api/dashboard/leader/candidate?leaderId=${leaderId}`)
      if (candidateResponse.ok) {
        const candidateData = await candidateResponse.json()
        setCandidate(candidateData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWitness = async (witnessId: string) => {
    const ok = window.confirm('¿Eliminar este testigo electoral? Esta acción no se puede deshacer.')
    if (!ok) return

    try {
      const response = await fetch('/api/dashboard/leader/witnesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId: currentUser?.id,
          witnessId
        })
      })

      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        toast.success('Testigo eliminado')
        fetchData(currentUser.id)
      } else {
        toast.error((data && (data.message || data.error)) || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleOpenChecklist = (witness: ElectoralWitness) => {
    setSelectedWitnessForChecklist(witness)
    setIsChecklistDialogOpen(true)
  }

  const handleChecklistUpdate = async () => {
    // Recargar datos
    await fetchData(currentUser.id)
    
    // Actualizar el testigo seleccionado con los nuevos datos
    if (selectedWitnessForChecklist) {
      const response = await fetch(`/api/dashboard/leader/witnesses?leaderId=${currentUser.id}`)
      if (response.ok) {
        const data = await response.json()
        const updatedWitness = data.data.find((w: ElectoralWitness) => w.id === selectedWitnessForChecklist.id)
        if (updatedWitness) {
          setSelectedWitnessForChecklist(updatedWitness)
        }
      }
    }
  }

  const handleGenerateWitnessPlan = async () => {
    try {
      setIsGeneratingPDF(true)
      toast.info('Generando plan de testigos...')
      
      await generateWitnessPlan(witnesses as any, candidate?.name || 'Candidato')
      toast.success('Plan de testigos generado exitosamente')
    } catch (error) {
      console.error('Error generating witness plan:', error)
      toast.error('Error al generar el plan de testigos')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleGenerateCoverageReport = async () => {
    try {
      setIsGeneratingPDF(true)
      toast.info('Generando reporte de cobertura...')
      
      // Obtener todos los puestos de votación
      const response = await fetch('/api/data/polling-stations')
      if (!response.ok) {
        throw new Error('Error al obtener puestos de votación')
      }
      
      const data = await response.json()
      const allStations = data.data || []
      
      await generateCoverageReport(witnesses as any, allStations, candidate?.name || 'Candidato')
      toast.success('Reporte de cobertura generado exitosamente')
    } catch (error) {
      console.error('Error generating coverage report:', error)
      toast.error('Error al generar el reporte de cobertura')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return <Badge variant="secondary">Asignado</Badge>
      case 'CONFIRMED':
        return <Badge variant="default">Confirmado</Badge>
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500">Activo</Badge>
      case 'COMPLETED':
        return <Badge variant="outline">Completado</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getExperienceBadge = (experience: string) => {
    return experience === 'EXPERIENCED' ? 
      <Badge variant="outline" className="text-green-600 border-green-600">Experimentado</Badge> :
      <Badge variant="outline">Primera vez</Badge>
  }

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'FULL_DAY':
        return <Clock className="w-3 h-3" />
      case 'MORNING':
        return <Clock className="w-3 h-3" />
      case 'AFTERNOON':
        return <Clock className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    description
  }: {
    title: string
    value: number | string
    icon: any
    description?: string
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando testigos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <img 
                    src="/alonso-del-rio.jpg" 
                    alt="Alonso del Río" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.innerHTML = '<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 via-blue-500/20 to-red-500/20 flex items-center justify-center"><svg class="w-6 h-6 text-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 1 0-16 0"></path></svg></div>'
                      }
                    }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded">
                  103
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold">Alonso del Río - Cámara 103</h1>
                <p className="text-xs text-muted-foreground">
                  Testigos Electorales - Líder: {currentUser?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="default" 
                size="sm"
                onClick={handleGenerateWitnessPlan}
                disabled={isGeneratingPDF || witnesses.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Plan de Testigos
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleGenerateCoverageReport}
                disabled={isGeneratingPDF || witnesses.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                Reporte de Cobertura
              </Button>
              <Link href="/dashboard/leader/testigos/reporte">
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Reporte por Puesto
                </Button>
              </Link>
              <Link href="/dashboard/leader">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <Badge variant="outline" className="hidden md:flex">
                <Shield className="w-3 h-3 mr-1" />
                Testigos
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Total Testigos"
            value={witnesses.length}
            icon={Shield}
            description="Testigos asignados"
          />
          <StatCard
            title="Mesas Asignadas"
            value={witnesses.reduce((sum, w) => sum + w.assignedTables.length, 0)}
            icon={UserCheck}
            description={`${witnesses.length > 0 ? (witnesses.reduce((sum, w) => sum + w.assignedTables.length, 0) / witnesses.length).toFixed(1) : 0} promedio por testigo`}
          />
          <StatCard
            title="Confirmados"
            value={witnesses.filter(w => w.status === 'CONFIRMED').length}
            icon={CheckCircle}
            description="Han confirmado asistencia"
          />
          <StatCard
            title="Con Transporte"
            value={witnesses.filter(w => w.hasTransport).length}
            icon={Car}
            description="Tienen transporte propio"
          />
          <StatCard
            title="Experimentados"
            value={witnesses.filter(w => w.experience === 'EXPERIENCED').length}
            icon={Star}
            description="Testigos con experiencia"
          />
        </div>

        {/* Witnesses List */}
        <Card className="h-[700px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Mis Testigos Electorales
            </CardTitle>
            <CardDescription>
              Gestiona y monitorea tus testigos electorales asignados
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {witnesses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay testigos electorales asignados aún</p>
                    <p className="text-xs mt-1">
                      Ve a la lista de votantes y usa el botón "Designar Testigo"
                    </p>
                  </div>
                ) : (
                  witnesses.map((witness) => (
                    <div
                      key={witness.id}
                      className="p-6 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      {/* Header del testigo */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{witness.voter.name}</h3>
                            {getStatusBadge(witness.status)}
                            {getExperienceBadge(witness.experience)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            CC: {witness.voter.document}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenChecklist(witness)}
                          >
                            <ClipboardCheck className="w-3 h-3 mr-1" />
                            Checklist
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteWitness(witness.id)}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      {/* Información de contacto */}
                      {(witness.voter.tel || witness.voter.celular || witness.voter.email) && (
                        <>
                          <Separator className="my-3" />
                          <div className="flex flex-wrap gap-4 text-sm">
                            {witness.voter.tel && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {witness.voter.tel}
                              </span>
                            )}
                            {witness.voter.celular && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Smartphone className="w-3 h-3" />
                                {witness.voter.celular}
                              </span>
                            )}
                            {witness.voter.email && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {witness.voter.email}
                              </span>
                            )}
                          </div>
                        </>
                      )}

                      {/* Asignación de puesto y mesas */}
                      <Separator className="my-3" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium mb-2">
                            <MapPin className="w-4 h-4" />
                            Puesto de Votación
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {witness.pollingStation.name}
                          </p>
                          {witness.pollingStation.community && (
                            <p className="text-xs text-muted-foreground">
                              {witness.pollingStation.community}
                            </p>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium mb-2">
                            <UserCheck className="w-4 h-4" />
                            Mesas Asignadas
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {witness.assignedTables.map(table => (
                              <Badge key={table} variant="outline" className="text-xs">
                                Mesa {table}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Información adicional */}
                      <Separator className="my-3" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          {getAvailabilityIcon(witness.availability)}
                          <span className="text-muted-foreground">
                            {witness.availability === 'FULL_DAY' ? 'Todo el día' :
                             witness.availability === 'MORNING' ? 'Solo mañana' : 'Solo tarde'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="w-3 h-3" />
                          <span className="text-muted-foreground">
                            {witness.hasTransport ? 'Tiene transporte' : 'Sin transporte'}
                          </span>
                        </div>
                        {witness.voter.tableNumber && (
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3 h-3" />
                            <span className="text-muted-foreground">
                              Vota en mesa {witness.voter.tableNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contacto de emergencia y notas */}
                      {(witness.emergencyContact || witness.notes) && (
                        <>
                          <Separator className="my-3" />
                          <div className="space-y-2">
                            {witness.emergencyContact && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Contacto de emergencia:</span>
                                <p className="text-sm">{witness.emergencyContact}</p>
                              </div>
                            )}
                            {witness.notes && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Notas:</span>
                                <p className="text-sm">{witness.notes}</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Fecha de asignación */}
                      <Separator className="my-3" />
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                          Asignado: {new Date(witness.createdAt).toLocaleDateString('es-CO')}
                        </span>
                        {witness.confirmedAt && (
                          <span>
                            Confirmado: {new Date(witness.confirmedAt).toLocaleDateString('es-CO')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground">
            © 2025 Gestión Electoral Colombia. Sistema de Testigos Electorales.
          </p>
        </div>
      </footer>

      {/* Diálogo de Checklist */}
      <Dialog open={isChecklistDialogOpen} onOpenChange={setIsChecklistDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Checklist del Día Electoral</DialogTitle>
            <DialogDescription>
              Monitorea el progreso del testigo durante el día electoral
            </DialogDescription>
          </DialogHeader>
          {selectedWitnessForChecklist && (
            <WitnessChecklist
              witnessId={selectedWitnessForChecklist.id}
              witnessName={selectedWitnessForChecklist.voter.name}
              pollingStation={selectedWitnessForChecklist.pollingStation.name}
              checklist={{
                confirmedAttendance: (selectedWitnessForChecklist as any).confirmedAttendance || false,
                receivedCredential: (selectedWitnessForChecklist as any).receivedCredential || false,
                arrivedAtStation: (selectedWitnessForChecklist as any).arrivedAtStation || false,
                reportedVotingStart: (selectedWitnessForChecklist as any).reportedVotingStart || false,
                reportedVotingEnd: (selectedWitnessForChecklist as any).reportedVotingEnd || false,
                deliveredAct: (selectedWitnessForChecklist as any).deliveredAct || false
              }}
              timestamps={{
                arrivedAt: (selectedWitnessForChecklist as any).arrivedAt,
                votingStartAt: (selectedWitnessForChecklist as any).votingStartAt,
                votingEndAt: (selectedWitnessForChecklist as any).votingEndAt,
                actDeliveredAt: (selectedWitnessForChecklist as any).actDeliveredAt
              }}
              onUpdate={handleChecklistUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}