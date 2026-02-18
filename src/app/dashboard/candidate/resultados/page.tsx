'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  RefreshCw,
  Download,
  Eye,
  Filter,
  X,
  Check,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { generateElectoralResultsPDF } from '@/lib/pdf-generator-results'

interface TableResult {
  id: string
  number: number
  pollingStation: {
    name: string
    code: string
    municipality: { name: string }
  }
  votesCandidate: number | null
  totalVotes: number | null
  votesRegistered: number | null
  reportedAt: string | null
  witness: {
    voter: { 
      name: string
      document: string
    }
    leader: {
      name: string
      document: string
    }
  } | null
  isValidated: boolean
}

interface PollingStationSummary {
  id: string
  name: string
  code: string
  municipality: string
  totalTables: number
  tablesReported: number
  votesCandidate: number
  totalVotes: number
  percentage: number
  witnesses: Array<{
    name: string
    document: string
    leader: string
    tablesAssigned: number[]
  }>
}

interface MunicipalitySummary {
  name: string
  totalTables: number
  tablesReported: number
  votesCandidate: number
  totalVotes: number
  percentage: number
}

interface Stats {
  totalTables: number
  tablesReported: number
  tablesValidated: number
  totalVotesCandidate: number
  totalVotesGeneral: number
  percentage: number
  // Nuevos campos para votos validados
  validatedVotesCandidate: number
  validatedVotesGeneral: number
  validatedPercentage: number
  // Campos para votos pendientes
  pendingVotesCandidate: number
  pendingVotesGeneral: number
  tablesPending: number
  lastUpdate: string | null
}

export default function ResultadosElectoralesPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [tableResults, setTableResults] = useState<TableResult[]>([])
  const [pollingStations, setPollingStations] = useState<PollingStationSummary[]>([])
  const [municipalities, setMunicipalities] = useState<MunicipalitySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [validatingTables, setValidatingTables] = useState<Set<string>>(new Set())

  // Filtros
  const [showFilters, setShowFilters] = useState(false)
  const [allMunicipalities, setAllMunicipalities] = useState<{id: string, name: string}[]>([])
  const [allPollingStations, setAllPollingStations] = useState<{id: string, name: string, code: string}[]>([])
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('')
  const [selectedPollingStation, setSelectedPollingStation] = useState<string>('')

  useEffect(() => {
    if (session?.user) {
      fetchResults()
      loadMunicipalities()
    }
  }, [session])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchResults(true)
    }, 30000) // Actualizar cada 30 segundos

    return () => clearInterval(interval)
  }, [autoRefresh, selectedMunicipality, selectedPollingStation])

  // Cargar puestos cuando se selecciona un municipio
  useEffect(() => {
    if (selectedMunicipality) {
      loadPollingStations(selectedMunicipality)
    } else {
      setAllPollingStations([])
      setSelectedPollingStation('')
    }
  }, [selectedMunicipality])

  const loadMunicipalities = async () => {
    try {
      const response = await fetch('/api/data/municipalities')
      const data = await response.json()
      // El endpoint ahora retorna directamente el array
      if (Array.isArray(data)) {
        setAllMunicipalities(data)
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
        setAllPollingStations(data)
      }
    } catch (error) {
      console.error('Error loading polling stations:', error)
    }
  }

  const fetchResults = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)

      const candidateId = (session?.user as any)?.id
      const params = new URLSearchParams({ candidateId })
      
      // Agregar filtros si están seleccionados
      if (selectedMunicipality) params.append('municipalityId', selectedMunicipality)
      if (selectedPollingStation) params.append('pollingStationId', selectedPollingStation)

      const response = await fetch(`/api/dashboard/candidate/resultados?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setTableResults(data.tableResults || [])
        setPollingStations(data.pollingStations || [])
        setMunicipalities(data.municipalities || [])
        
        if (!silent) {
          toast.success('Resultados actualizados')
        }
      } else {
        toast.error('Error al cargar resultados')
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      if (!silent) {
        toast.error('Error de conexión')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedMunicipality('')
    setSelectedPollingStation('')
    setAllPollingStations([])
  }

  const hasActiveFilters = selectedMunicipality || selectedPollingStation

  const getFilterLabel = () => {
    if (selectedPollingStation) {
      const station = allPollingStations.find(s => s.id === selectedPollingStation)
      return `Puesto: ${station?.name}`
    }
    if (selectedMunicipality) {
      const municipality = allMunicipalities.find(m => m.id === selectedMunicipality)
      return `Municipio: ${municipality?.name}`
    }
    return 'Todos los resultados'
  }

  const handleExportResults = () => {
    try {
      if (!stats) {
        toast.error('No hay datos para exportar')
        return
      }

      toast.info('Generando PDF de resultados...')
      
      const fileName = generateElectoralResultsPDF(
        stats,
        tableResults,
        pollingStations,
        municipalities,
        'Alonso del Río'
      )
      
      toast.success(`✅ PDF generado: ${fileName}`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el PDF')
    }
  }

  const handleValidateTable = async (tableId: string, currentStatus: boolean) => {
    try {
      setValidatingTables(prev => new Set(prev).add(tableId))
      
      const response = await fetch('/api/dashboard/candidate/validate-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          isValidated: !currentStatus
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(
          !currentStatus ? '✅ Mesa validada correctamente' : 'Mesa marcada como no validada'
        )
        
        // Actualizar el estado local
        setTableResults(prev => 
          prev.map(table => 
            table.id === tableId 
              ? { ...table, isValidated: !currentStatus }
              : table
          )
        )
        
        // Actualizar estadísticas
        fetchResults(true)
      } else {
        toast.error(data.error || 'Error al validar mesa')
      }
    } catch (error) {
      console.error('Error validating table:', error)
      toast.error('Error de conexión al validar mesa')
    } finally {
      setValidatingTables(prev => {
        const newSet = new Set(prev)
        newSet.delete(tableId)
        return newSet
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando resultados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/candidate">
                <Button variant="ghost" size="sm">
                  ← Volver al Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold">Resultados Electorales en Tiempo Real</h1>
                <p className="text-xs text-muted-foreground">
                  Monitoreo de votos reportados por testigos - {getFilterLabel()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {[selectedMunicipality, selectedPollingStation].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchResults()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Auto-actualización ON' : 'Auto-actualización OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportResults}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Panel de Filtros */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros de Resultados
                  </CardTitle>
                  <CardDescription>
                    Filtra los resultados por municipio o puesto de votación específico
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtro por Municipio */}
                <div className="space-y-2">
                  <Label htmlFor="municipality-filter">Municipio</Label>
                  <Select
                    value={selectedMunicipality}
                    onValueChange={(value) => {
                      setSelectedMunicipality(value)
                      setSelectedPollingStation('')
                    }}
                  >
                    <SelectTrigger id="municipality-filter">
                      <SelectValue placeholder="Todos los municipios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los municipios</SelectItem>
                      {allMunicipalities.map((municipality) => (
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
                    onValueChange={setSelectedPollingStation}
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
                      {allPollingStations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name} ({station.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botón Aplicar Filtros */}
              <div className="mt-4 flex justify-end">
                <Button onClick={() => fetchResults()}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Aplicar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mesas Reportadas</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.tablesReported || 0} / {stats?.totalTables || 0}
              </div>
              <Progress 
                value={stats?.totalTables ? (stats.tablesReported / stats.totalTables) * 100 : 0} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.totalTables ? Math.round((stats.tablesReported / stats.totalTables) * 100) : 0}% completado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mesas Validadas</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.tablesValidated || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.tablesReported ? Math.round((stats.tablesValidated / stats.tablesReported) * 100) : 0}% de las reportadas
              </p>
              <Badge variant="outline" className="border-green-500 text-green-700 mt-2">
                ✓ Verificadas
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mesas Pendientes</CardTitle>
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.tablesPending || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Por validar
              </p>
              <Badge variant="outline" className="border-yellow-500 text-yellow-700 mt-2">
                ⏳ Sin verificar
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats?.lastUpdate 
                  ? new Date(stats.lastUpdate).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Sin reportes'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {autoRefresh ? 'Actualización automática activa' : 'Actualización manual'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Votos Overview - Nueva sección */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Votos Reportados</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalVotesCandidate?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                De {stats?.totalVotesGeneral?.toLocaleString() || 0} votos totales
              </p>
              <Badge variant="default" className="bg-blue-500 mt-2">
                {stats?.percentage?.toFixed(2) || 0}%
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                🔵 Todas las mesas reportadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Votos Validados ✓</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.validatedVotesCandidate?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                De {stats?.validatedVotesGeneral?.toLocaleString() || 0} votos totales
              </p>
              <Badge variant="default" className="bg-green-500 mt-2">
                {stats?.validatedPercentage?.toFixed(2) || 0}%
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                🟢 Solo mesas verificadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Votos Pendientes</CardTitle>
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.pendingVotesCandidate?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                De {stats?.pendingVotesGeneral?.toLocaleString() || 0} votos totales
              </p>
              <Badge variant="outline" className="border-yellow-500 text-yellow-700 mt-2">
                Por validar
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                🟡 Mesas sin verificar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="puestos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="puestos">Por Puesto de Votación</TabsTrigger>
            <TabsTrigger value="municipios">Por Municipio</TabsTrigger>
            <TabsTrigger value="mesas">Detalle de Mesas</TabsTrigger>
          </TabsList>

          {/* Por Puesto de Votación */}
          <TabsContent value="puestos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resultados por Puesto de Votación</CardTitle>
                <CardDescription>
                  Resumen de votos por cada puesto de votación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pollingStations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay resultados reportados aún</p>
                    </div>
                  ) : (
                    pollingStations.map((station) => (
                      <Card key={station.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{station.name}</CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <MapPin className="w-3 h-3" />
                                {station.municipality} • Código: {station.code}
                              </CardDescription>
                            </div>
                            <Badge variant={station.tablesReported === station.totalTables ? 'default' : 'secondary'}>
                              {station.tablesReported}/{station.totalTables} mesas
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Votos Obtenidos</p>
                              <p className="text-lg font-bold text-primary">{station.votesCandidate}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Votos</p>
                              <p className="text-lg font-bold">{station.totalVotes}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Porcentaje</p>
                              <p className="text-lg font-bold">{station.percentage.toFixed(1)}%</p>
                            </div>
                          </div>
                          <Progress value={station.percentage} className="h-2 mb-3" />
                          
                          {/* Testigos asignados */}
                          {station.witnesses && station.witnesses.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Testigos Asignados ({station.witnesses.length})
                              </p>
                              <div className="space-y-2">
                                {station.witnesses.map((witness, idx) => (
                                  <div key={idx} className="flex items-start justify-between p-2 bg-muted/50 rounded text-xs">
                                    <div className="flex-1">
                                      <p className="font-medium">{witness.name}</p>
                                      <p className="text-muted-foreground">CC: {witness.document}</p>
                                      <p className="text-muted-foreground">Líder: {witness.leader}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-muted-foreground">Mesas</p>
                                      <div className="flex gap-1 mt-1">
                                        {witness.tablesAssigned.map(table => (
                                          <Badge key={table} variant="outline" className="text-xs px-1">
                                            {table}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Por Municipio */}
          <TabsContent value="municipios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resultados por Municipio</CardTitle>
                <CardDescription>
                  Consolidado de votos por municipio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {municipalities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay resultados reportados aún</p>
                    </div>
                  ) : (
                    municipalities.map((muni, index) => (
                      <Card key={index} className="border-l-4 border-l-secondary">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{muni.name}</CardTitle>
                            <Badge variant="outline">
                              {muni.tablesReported}/{muni.totalTables} mesas
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Votos Obtenidos</p>
                              <p className="text-lg font-bold text-primary">{muni.votesCandidate}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Votos</p>
                              <p className="text-lg font-bold">{muni.totalVotes}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Porcentaje</p>
                              <p className="text-lg font-bold">{muni.percentage.toFixed(1)}%</p>
                            </div>
                          </div>
                          <Progress value={muni.percentage} className="h-2" />
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detalle de Mesas */}
          <TabsContent value="mesas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Mesas Reportadas</CardTitle>
                <CardDescription>
                  Información detallada de cada mesa electoral
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tableResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay mesas reportadas aún</p>
                    </div>
                  ) : (
                    tableResults.map((table) => (
                      <Card key={table.id} className="border">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">Mesa #{table.number}</Badge>
                                {table.isValidated && (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Validada
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium">{table.pollingStation.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {table.pollingStation.municipality.name} • Código: {table.pollingStation.code}
                              </p>
                            </div>
                            <div className="text-right">
                              {table.witness ? (
                                <>
                                  <p className="text-xs text-muted-foreground">Testigo</p>
                                  <p className="text-sm font-medium">
                                    {table.witness.voter.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    CC: {table.witness.voter.document}
                                  </p>
                                  <div className="mt-2 pt-2 border-t">
                                    <p className="text-xs text-muted-foreground">Líder</p>
                                    <p className="text-xs font-medium">
                                      {table.witness.leader.name}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground">Sin testigo</p>
                              )}
                              {table.reportedAt && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(table.reportedAt).toLocaleString('es-CO', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Nuestros Votos</p>
                              <p className="text-xl font-bold text-primary">
                                {table.votesCandidate ?? '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Mesa</p>
                              <p className="text-xl font-bold">
                                {table.totalVotes ?? '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Votos Registrados</p>
                              <p className="text-xl font-bold">
                                {table.votesRegistered ?? '-'}
                              </p>
                            </div>
                          </div>

                          {/* Botón de Validación */}
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant={table.isValidated ? "outline" : "default"}
                              onClick={() => handleValidateTable(table.id, table.isValidated)}
                              disabled={validatingTables.has(table.id)}
                              className={table.isValidated ? "border-green-500 text-green-700 hover:bg-green-50" : ""}
                            >
                              {validatingTables.has(table.id) ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Procesando...
                                </>
                              ) : table.isValidated ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Marcar como No Validada
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Validar Mesa
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
