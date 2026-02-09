'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
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
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

interface TablePriority {
  pollingStationId: string
  pollingStationName: string
  pollingStationCode: string
  community?: string
  address?: string
  municipalityId: string
  municipalityName: string
  tableNumber: string
  voterCount: number
  hasWitness: boolean
  witnessCount: number
  leaderBreakdown: Record<string, { name: string, count: number }>
  voters: Array<{
    id: string
    name: string
    document: string
    celular?: string
    tel?: string
    leaderName: string
  }>
}

interface PriorityReport {
  tables: TablePriority[]
  statistics: {
    totalTables: number
    tablesWithWitness: number
    tablesWithoutWitness: number
    coveragePercentage: number
    totalVoters: number
    votersWithWitness: number
    votersWithoutWitness: number
    voterCoveragePercentage: number
    totalLeaders: number
    totalWitnesses: number
  }
  byPollingStation: Array<{
    pollingStationId: string
    pollingStationName: string
    municipalityName: string
    community?: string
    totalTables: number
    tablesWithWitness: number
    totalVoters: number
    votersWithWitness: number
    coveragePercentage: number
  }>
  byLeader: Array<{
    leaderId: string
    leaderName: string
    totalVoters: number
    totalWitnesses: number
    tablesWithWitness: number
  }>
}

export default function CandidatePriorityReportPage() {
  const { data: session, status } = useSession()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [report, setReport] = useState<PriorityReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-witness' | 'without-witness'>('all')

  useEffect(() => {
    if (isRedirecting) return
    if (status === 'authenticated' && session?.user) {
      setCurrentUser(session.user)
      fetchReport((session.user as any).id)
    } else if (status === 'unauthenticated') {
      setIsRedirecting(true)
      window.location.href = '/login'
    }
  }, [status, session, isRedirecting])

  const fetchReport = async (candidateId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/dashboard/candidate/witnesses/priority-report?candidateId=${candidateId}`)
      if (response.ok) {
        const data = await response.json()
        setReport(data.data)
      } else {
        toast.error('Error al cargar el reporte')
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Error al cargar el reporte')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  const getPriorityBadge = (voterCount: number) => {
    if (voterCount >= 10) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        Alta
      </Badge>
    } else if (voterCount >= 5) {
      return <Badge variant="default" className="bg-yellow-500 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Media
      </Badge>
    } else {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <TrendingDown className="w-3 h-3" />
        Baja
      </Badge>
    }
  }

  const filteredTables = report?.tables.filter(table => {
    // Filtro por estado de testigo
    if (filterStatus === 'with-witness' && !table.hasWitness) return false
    if (filterStatus === 'without-witness' && table.hasWitness) return false

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        table.pollingStationName.toLowerCase().includes(query) ||
        table.tableNumber.includes(query) ||
        table.municipalityName.toLowerCase().includes(query) ||
        table.community?.toLowerCase().includes(query)
      )
    }

    return true
  }) || []

  const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
    trend
  }: {
    title: string
    value: number | string
    icon: any
    description?: string
    trend?: 'up' | 'down' | 'neutral'
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${
          trend === 'up' ? 'bg-green-500/10' :
          trend === 'down' ? 'bg-red-500/10' :
          'bg-primary/10'
        }`}>
          <Icon className={`w-4 h-4 ${
            trend === 'up' ? 'text-green-500' :
            trend === 'down' ? 'text-red-500' :
            'text-primary'
          }`} />
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
          <p className="text-muted-foreground">Generando reporte...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">No se pudo cargar el reporte</p>
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
                <h1 className="text-lg font-bold">Reporte de Priorización</h1>
                <p className="text-xs text-muted-foreground">
                  Análisis consolidado de cobertura electoral
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/candidate/testigos">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Cobertura de Mesas"
            value={`${report.statistics.coveragePercentage}%`}
            icon={Shield}
            description={`${report.statistics.tablesWithWitness} de ${report.statistics.totalTables} mesas`}
            trend={report.statistics.coveragePercentage >= 70 ? 'up' : report.statistics.coveragePercentage >= 40 ? 'neutral' : 'down'}
          />
          <StatCard
            title="Cobertura de Votantes"
            value={`${report.statistics.voterCoveragePercentage}%`}
            icon={Users}
            description={`${report.statistics.votersWithWitness} de ${report.statistics.totalVoters} votantes`}
            trend={report.statistics.voterCoveragePercentage >= 70 ? 'up' : report.statistics.voterCoveragePercentage >= 40 ? 'neutral' : 'down'}
          />
          <StatCard
            title="Total Testigos"
            value={report.statistics.totalWitnesses}
            icon={Shield}
            description={`${report.statistics.totalLeaders} líderes activos`}
            trend="neutral"
          />
          <StatCard
            title="Mesas Sin Testigo"
            value={report.statistics.tablesWithoutWitness}
            icon={AlertTriangle}
            description="Requieren atención"
            trend="down"
          />
        </div>

        {/* Leader Stats */}
        {report.byLeader.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Estadísticas por Líder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.byLeader.map(leader => (
                  <div key={leader.leaderId} className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">{leader.leaderName}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Votantes:</span>
                        <span className="font-medium">{leader.totalVoters}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Testigos:</span>
                        <span className="font-medium">{leader.totalWitnesses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mesas cubiertas:</span>
                        <span className="font-medium">{leader.tablesWithWitness}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por puesto, mesa o zona..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  Todas
                </Button>
                <Button
                  variant={filterStatus === 'with-witness' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('with-witness')}
                >
                  Con Testigo
                </Button>
                <Button
                  variant={filterStatus === 'without-witness' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('without-witness')}
                >
                  Sin Testigo
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Mostrando {filteredTables.length} de {report.tables.length} mesas</span>
            </div>
          </CardContent>
        </Card>

        {/* Priority Tables List */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Mesas Priorizadas
            </CardTitle>
            <CardDescription>
              Ordenadas por cantidad de votantes (mayor a menor)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {filteredTables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No se encontraron mesas con los filtros aplicados</p>
                  </div>
                ) : (
                  filteredTables.map((table, index) => (
                    <div
                      key={`${table.pollingStationId}-${table.tableNumber}`}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <h3 className="font-semibold">Mesa {table.tableNumber}</h3>
                            {getPriorityBadge(table.voterCount)}
                            {table.hasWitness && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {table.witnessCount} Testigo{table.witnessCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{table.pollingStationName}</span>
                            {table.community && (
                              <>
                                <span>•</span>
                                <span>{table.community}</span>
                              </>
                            )}
                          </div>
                          {Object.keys(table.leaderBreakdown).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(table.leaderBreakdown).map(([leaderId, data]) => (
                                <Badge key={leaderId} variant="outline" className="text-xs">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  {data.name}: {data.count} votante{data.count > 1 ? 's' : ''}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {table.voterCount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            votante{table.voterCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {!table.hasWitness && table.voterCount >= 5 && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Mesa prioritaria sin testigo asignado
                        </div>
                      )}
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
            © 2025 Gestión Electoral Colombia. Reporte de Priorización de Mesas.
          </p>
        </div>
      </footer>
    </div>
  )
}