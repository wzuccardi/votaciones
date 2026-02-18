'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Shield, 
  Users, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle,
  MapPin,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Filter,
  X,
  Clock,
  Activity,
  Award,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

interface DashboardStats {
  witnesses: {
    total: number
    active: number
    confirmed: number
  }
  tables: {
    assigned: number
    reported: number
    coverage: number
  }
  votes: {
    candidate: number
    registered: number
    blank: number
    null: number
    percentage: number
  }
  irregularities: number
  uniqueStations: number
  reportsByHour: Array<{ hour: number; count: number }>
  topWitnesses: Array<{
    name: string
    tablesReported: number
    lastReportAt?: string
  }>
  // Nuevos datos para gráficas
  votesByMunicipality?: Array<{
    name: string
    votes: number
    total: number
    percentage: number
  }>
  votesByStation?: Array<{
    name: string
    votes: number
    total: number
    percentage: number
  }>
  votesByTable?: Array<{
    number: number
    votes: number
    total: number
    percentage: number
  }>
}

interface Municipality {
  id: string
  name: string
}

interface PollingStation {
  id: string
  name: string
  code: string
}

interface Witness {
  id: string
  voter: {
    name: string
    document: string
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function MonitoringDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  // Filtros
  const [showFilters, setShowFilters] = useState(false)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [pollingStations, setPollingStations] = useState<PollingStation[]>([])
  const [witnesses, setWitnesses] = useState<Witness[]>([])
  
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('')
  const [selectedPollingStation, setSelectedPollingStation] = useState<string>('')
  const [selectedWitness, setSelectedWitness] = useState<string>('')

  useEffect(() => {
    if (session?.user) {
      fetchStats()
      loadMunicipalities()
      loadWitnesses()
    }
  }, [session])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchStats(true)
    }, 30000) // Actualizar cada 30 segundos

    return () => clearInterval(interval)
  }, [autoRefresh, session, selectedMunicipality, selectedPollingStation, selectedWitness])

  // Cargar puestos cuando se selecciona un municipio
  useEffect(() => {
    if (selectedMunicipality) {
      loadPollingStations(selectedMunicipality)
    } else {
      setPollingStations([])
      setSelectedPollingStation('')
    }
  }, [selectedMunicipality])

  const loadMunicipalities = async () => {
    try {
      const response = await fetch('/api/data/municipalities')
      const data = await response.json()
      // El endpoint ahora retorna directamente el array
      if (Array.isArray(data)) {
        setMunicipalities(data)
      }
    } catch (error) {
      console.error('Error loading municipalities:', error)
    }
  }

  const loadPollingStations = async (municipalityId: string) => {
    try {
      const response = await fetch(`/api/data/polling-stations?municipalityId=${municipalityId}`)
      const data = await response.json()
      // El endpoint ahora retorna directamente el array
      if (Array.isArray(data)) {
        setPollingStations(data)
      }
    } catch (error) {
      console.error('Error loading polling stations:', error)
    }
  }

  const loadWitnesses = async () => {
    try {
      const leaderId = (session?.user as any)?.id
      const response = await fetch(`/api/dashboard/leader/witnesses?leaderId=${leaderId}`)
      const data = await response.json()
      if (data.success) {
        setWitnesses(data.data || [])
      }
    } catch (error) {
      console.error('Error loading witnesses:', error)
    }
  }

  const fetchStats = async (silent = false) => {
    try {
      if (!silent) setLoading(true)

      const leaderId = (session?.user as any)?.id
      const params = new URLSearchParams({ leaderId })
      
      // Agregar filtros si están seleccionados
      if (selectedMunicipality) params.append('municipalityId', selectedMunicipality)
      if (selectedPollingStation) params.append('pollingStationId', selectedPollingStation)
      if (selectedWitness) params.append('witnessId', selectedWitness)

      const response = await fetch(`/api/dashboard/stats?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
        if (!silent) {
          toast.success('Datos actualizados')
        }
      }
    } catch (error) {
      if (!silent) {
        toast.error('Error al cargar estadísticas')
      }
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedMunicipality('')
    setSelectedPollingStation('')
    setSelectedWitness('')
    setPollingStations([])
  }

  const hasActiveFilters = selectedMunicipality || selectedPollingStation || selectedWitness

  const getFilterLabel = () => {
    if (selectedWitness) {
      const witness = witnesses.find(w => w.id === selectedWitness)
      return `Testigo: ${witness?.voter.name}`
    }
    if (selectedPollingStation) {
      const station = pollingStations.find(s => s.id === selectedPollingStation)
      return `Puesto: ${station?.name}`
    }
    if (selectedMunicipality) {
      const municipality = municipalities.find(m => m.id === selectedMunicipality)
      return `Municipio: ${municipality?.name}`
    }
    return 'General'
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'text-primary'
  }: {
    title: string
    value: string | number
    subtitle?: string
    icon: any
    color?: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard de Monitoreo</h1>
              <p className="text-sm text-muted-foreground">
                Seguimiento en tiempo real - {getFilterLabel()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {[selectedMunicipality, selectedPollingStation, selectedWitness].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStats()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Badge variant={autoRefresh ? 'default' : 'secondary'}>
                {autoRefresh ? 'Auto-actualización ON' : 'Auto-actualización OFF'}
              </Badge>
              <Link href="/dashboard/leader">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Panel de Filtros */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros de Reporte
                  </CardTitle>
                  <CardDescription>
                    Filtra los datos por municipio, puesto de votación o testigo específico
                  </CardDescription>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por Municipio */}
                <div className="space-y-2">
                  <Label htmlFor="municipality-filter">Municipio</Label>
                  <Select
                    value={selectedMunicipality}
                    onValueChange={(value) => {
                      setSelectedMunicipality(value)
                      setSelectedPollingStation('')
                      setSelectedWitness('')
                    }}
                  >
                    <SelectTrigger id="municipality-filter">
                      <SelectValue placeholder="Todos los municipios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los municipios</SelectItem>
                      {municipalities.map((municipality) => (
                        <SelectItem key={municipality.id} value={municipality.id}>
                          {municipality.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Puesto de Votación */}
                <div className="space-y-2">
                  <Label htmlFor="station-filter">Puesto de Votación</Label>
                  <Select
                    value={selectedPollingStation}
                    onValueChange={(value) => {
                      setSelectedPollingStation(value)
                      setSelectedWitness('')
                    }}
                    disabled={!selectedMunicipality}
                  >
                    <SelectTrigger id="station-filter">
                      <SelectValue placeholder={
                        selectedMunicipality 
                          ? "Todos los puestos" 
                          : "Selecciona un municipio primero"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los puestos</SelectItem>
                      {pollingStations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name} ({station.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Testigo */}
                <div className="space-y-2">
                  <Label htmlFor="witness-filter">Testigo Electoral</Label>
                  <Select
                    value={selectedWitness}
                    onValueChange={setSelectedWitness}
                  >
                    <SelectTrigger id="witness-filter">
                      <SelectValue placeholder="Todos los testigos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los testigos</SelectItem>
                      {witnesses.map((witness) => (
                        <SelectItem key={witness.id} value={witness.id}>
                          {witness.voter.name} ({witness.voter.document})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botón Aplicar Filtros */}
              <div className="mt-4 flex justify-end">
                <Button onClick={() => fetchStats()}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Aplicar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Testigos Totales"
            value={stats.witnesses.total}
            subtitle={`${stats.witnesses.confirmed} confirmados`}
            icon={Shield}
          />
          <StatCard
            title="Testigos Activos"
            value={stats.witnesses.active}
            subtitle="En el puesto ahora"
            icon={Users}
            color="text-green-600"
          />
          <StatCard
            title="Cobertura de Mesas"
            value={`${stats.tables.coverage}%`}
            subtitle={`${stats.tables.reported}/${stats.tables.assigned} mesas`}
            icon={CheckCircle}
            color="text-blue-600"
          />
          <StatCard
            title="Puestos Cubiertos"
            value={stats.uniqueStations}
            subtitle="Puestos con testigos"
            icon={MapPin}
            color="text-purple-600"
          />
        </div>

        {/* Gráfica Principal Dinámica */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {selectedPollingStation 
                ? 'Votación por Mesa' 
                : selectedMunicipality 
                  ? 'Votación por Puesto' 
                  : 'Votación por Municipio'}
            </CardTitle>
            <CardDescription>
              {selectedPollingStation 
                ? 'Votos reportados en cada mesa del puesto seleccionado' 
                : selectedMunicipality 
                  ? 'Votos reportados en cada puesto del municipio' 
                  : 'Distribución de votos por municipio'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={
                  selectedPollingStation 
                    ? stats.votesByTable || []
                    : selectedMunicipality 
                      ? stats.votesByStation || []
                      : stats.votesByMunicipality || []
                }
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey={selectedPollingStation ? "number" : "name"} 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'votes') return [value, 'Nuestros Votos']
                    if (name === 'total') return [value, 'Total Votos']
                    return [value, name]
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => {
                    if (value === 'votes') return 'Nuestros Votos'
                    if (value === 'total') return 'Total Votos'
                    return value
                  }}
                />
                <Bar dataKey="votes" fill="#3b82f6" name="votes" radius={[8, 8, 0, 0]} />
                <Bar dataKey="total" fill="#94a3b8" name="total" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráficas de Progreso y Distribución */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Votos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Votos Reportados
              </CardTitle>
              <CardDescription>
                Resultados acumulados de las mesas reportadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Alonso del Río</span>
                  <span className="text-muted-foreground">
                    {stats.votes.candidate} votos ({stats.votes.percentage}%)
                  </span>
                </div>
                <Progress value={stats.votes.percentage} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.votes.registered}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">En Blanco</p>
                  <p className="text-2xl font-bold">{stats.votes.blank}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nulos</p>
                  <p className="text-2xl font-bold">{stats.votes.null}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progreso de Cobertura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Progreso de Reportes
              </CardTitle>
              <CardDescription>
                Mesas reportadas vs asignadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Cobertura Total</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.tables.reported}/{stats.tables.assigned}
                    </span>
                  </div>
                  <Progress value={stats.tables.coverage} className="h-4" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.tables.coverage}% de mesas reportadas
                  </p>
                </div>

                {stats.irregularities > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                      <div>
                        <p className="font-medium">
                          {stats.irregularities} Irregularidades Reportadas
                        </p>
                        <p className="text-xs">
                          Revisa los reportes para más detalles
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Testigos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Testigos Más Activos
            </CardTitle>
            <CardDescription>
              Top 5 testigos con más mesas reportadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topWitnesses.map((witness, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{witness.name}</p>
                      {witness.lastReportAt && (
                        <p className="text-xs text-muted-foreground">
                          Último reporte: {new Date(witness.lastReportAt).toLocaleTimeString('es-CO')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="default">
                    {witness.tablesReported} mesas
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
