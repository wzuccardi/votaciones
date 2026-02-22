'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, UserPlus, Trash2, Download, ChevronRight, ChevronDown, Phone, MapPin, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { generateHierarchyPDF } from '@/lib/pdf-generator-hierarchy'

interface SubLeader {
  id: string
  document: string
  name: string
  _count: {
    voters: number
    subLeaders: number
  }
  voters?: Array<{
    id: string
    document: string
    name: string
    celular?: string
    municipality?: string
    pollingStation?: string
    tableNumber?: string
  }>
}

interface SubLeadersManagerProps {
  leaderId: string
  leaderName: string
  candidateName: string
}

export function SubLeadersManager({ leaderId, leaderName, candidateName }: SubLeadersManagerProps) {
  const [subLeaders, setSubLeaders] = useState<SubLeader[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [expandedSubLeaders, setExpandedSubLeaders] = useState<Set<string>>(new Set())

  // Form state
  const [document, setDocument] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [celular, setCelular] = useState('')
  const [tel, setTel] = useState('')
  const [email, setEmail] = useState('')
  const [municipalityId, setMunicipalityId] = useState('')
  const [pollingStationId, setPollingStationId] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  
  // Data for selects
  const [municipalities, setMunicipalities] = useState<any[]>([])
  const [pollingStations, setPollingStations] = useState<any[]>([])
  const [tables, setTables] = useState<any[]>([])

  useEffect(() => {
    fetchSubLeaders()
    loadMunicipalities()
  }, [leaderId])

  useEffect(() => {
    if (municipalityId) {
      loadPollingStations(municipalityId)
    } else {
      setPollingStations([])
      setPollingStationId('')
    }
  }, [municipalityId])

  useEffect(() => {
    if (pollingStationId) {
      loadTables(pollingStationId)
    } else {
      setTables([])
      setTableNumber('')
    }
  }, [pollingStationId])

  const loadMunicipalities = async () => {
    try {
      const res = await fetch('/api/data/municipalities')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setMunicipalities(data)
      }
    } catch (e) {
      console.error('Error loading municipalities:', e)
    }
  }

  const loadPollingStations = async (munId: string) => {
    try {
      const res = await fetch(`/api/data/polling-stations?municipalityId=${munId}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setPollingStations(data)
      }
    } catch (e) {
      console.error('Error loading polling stations:', e)
    }
  }

  const loadTables = async (stationId: string) => {
    try {
      const res = await fetch(`/api/data/tables?pollingStationId=${stationId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) setTables(data.data || [])
      }
    } catch (e) {
      console.error('Error loading tables:', e)
    }
  }

  const fetchSubLeaders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/dashboard/leader/subleaders?leaderId=${leaderId}`)
      const data = await response.json()
      
      if (data.success) {
        setSubLeaders(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching subleaders:', error)
      toast.error('Error al cargar sublíderes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSubLeader = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Validaciones
      if (!celular && !tel) {
        toast.error('Debe proporcionar al menos un teléfono de contacto')
        setIsCreating(false)
        return
      }
      if (!municipalityId) {
        toast.error('El municipio es obligatorio')
        setIsCreating(false)
        return
      }
      if (!pollingStationId) {
        toast.error('El puesto de votación es obligatorio')
        setIsCreating(false)
        return
      }
      if (!tableNumber) {
        toast.error('El número de mesa es obligatorio')
        setIsCreating(false)
        return
      }

      const response = await fetch('/api/dashboard/leader/subleaders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document,
          name,
          password,
          parentLeaderId: leaderId,
          // Datos de votante
          celular,
          tel,
          email,
          municipalityId,
          pollingStationId,
          tableNumber
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Sublíder creado exitosamente (también registrado como votante)')
        // Limpiar formulario
        setDocument('')
        setName('')
        setPassword('')
        setCelular('')
        setTel('')
        setEmail('')
        setMunicipalityId('')
        setPollingStationId('')
        setTableNumber('')
        setIsDialogOpen(false)
        fetchSubLeaders()
      } else {
        toast.error(data.error || 'Error al crear sublíder')
      }
    } catch (error) {
      console.error('Error creating subleader:', error)
      toast.error('Error de conexión')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteSubLeader = async (subLeaderId: string, subLeaderName: string) => {
    if (!confirm(`¿Estás seguro de eliminar al sublíder ${subLeaderName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/dashboard/leader/subleaders?subLeaderId=${subLeaderId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Sublíder eliminado exitosamente')
        fetchSubLeaders()
      } else {
        toast.error(data.error || 'Error al eliminar sublíder')
      }
    } catch (error) {
      console.error('Error deleting subleader:', error)
      toast.error('Error de conexión')
    }
  }

  const toggleSubLeader = async (subLeaderId: string) => {
    const isExpanded = expandedSubLeaders.has(subLeaderId)
    
    if (isExpanded) {
      // Colapsar
      const newExpanded = new Set(expandedSubLeaders)
      newExpanded.delete(subLeaderId)
      setExpandedSubLeaders(newExpanded)
    } else {
      // Expandir y cargar votantes si no están cargados
      const subLeader = subLeaders.find(sl => sl.id === subLeaderId)
      if (subLeader && !subLeader.voters) {
        try {
          const response = await fetch(`/api/dashboard/leader/voters?leaderId=${subLeaderId}`)
          const data = await response.json()
          
          if (data.success) {
            // Actualizar el sublíder con sus votantes
            setSubLeaders(prev => prev.map(sl => 
              sl.id === subLeaderId 
                ? { ...sl, voters: data.data || [] }
                : sl
            ))
          }
        } catch (error) {
          console.error('Error loading subleader voters:', error)
          toast.error('Error al cargar votantes del sublíder')
          return
        }
      }
      
      const newExpanded = new Set(expandedSubLeaders)
      newExpanded.add(subLeaderId)
      setExpandedSubLeaders(newExpanded)
    }
  }

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true)
    toast.info('Generando reporte jerárquico...')

    try {
      const response = await fetch(`/api/dashboard/leader/hierarchy?leaderId=${leaderId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        const fileName = generateHierarchyPDF(data.data, candidateName)
        toast.success(`✅ PDF generado: ${fileName}`)
      } else {
        toast.error('Error al obtener datos para el reporte')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sublíderes
            </CardTitle>
            <CardDescription>
              Gestiona los sublíderes bajo tu estructura
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsDialogOpen(true)}
              style={{ 
                backgroundColor: '#2563eb', 
                color: '#ffffff',
                fontWeight: 600,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <UserPlus className="w-4 h-4" style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff' }}>Agregar Sublíder</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? 'Generando...' : 'Reporte PDF'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando sublíderes...
          </div>
        ) : subLeaders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tienes sublíderes registrados</p>
            <p className="text-sm mt-1">Crea sublíderes para delegar la gestión de votantes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subLeaders.map((subLeader) => {
              const isExpanded = expandedSubLeaders.has(subLeader.id)
              return (
                <Card key={subLeader.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => toggleSubLeader(subLeader.id)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title={isExpanded ? 'Ocultar votantes' : 'Ver votantes'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          <h4 className="font-medium">{subLeader.name}</h4>
                          <Badge variant="outline">Sublíder</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground ml-9">
                          CC: {subLeader.document}
                        </p>
                        <div className="flex gap-4 mt-2 ml-9">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Votantes: </span>
                            <span className="font-medium">{subLeader._count.voters}</span>
                          </div>
                          {subLeader._count.subLeaders > 0 && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Sublíderes: </span>
                              <span className="font-medium">{subLeader._count.subLeaders}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubLeader(subLeader.id, subLeader.name)}
                        disabled={subLeader._count.subLeaders > 0}
                        title={subLeader._count.subLeaders > 0 ? 'No puedes eliminar un líder con sublíderes' : 'Eliminar sublíder'}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Lista de votantes expandible */}
                    {isExpanded && (
                      <div className="ml-9 mt-4 border-t pt-4">
                        {!subLeader.voters ? (
                          <div className="text-center py-4 text-muted-foreground">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-sm">Cargando votantes...</p>
                          </div>
                        ) : subLeader.voters.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Este sublíder no tiene votantes registrados</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm font-medium mb-3">
                              Votantes de {subLeader.name} ({subLeader.voters.length})
                            </p>
                            {subLeader.voters.map((voter) => (
                              <div
                                key={voter.id}
                                className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{voter.name}</p>
                                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Hash className="w-3 h-3" />
                                        {voter.document}
                                      </span>
                                      {voter.celular && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="w-3 h-3" />
                                          {voter.celular}
                                        </span>
                                      )}
                                      {voter.municipality && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {voter.municipality}
                                        </span>
                                      )}
                                    </div>
                                    {voter.pollingStation && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {voter.pollingStation}
                                        {voter.tableNumber && ` - Mesa ${voter.tableNumber}`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Dialog separado */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Sublíder</DialogTitle>
            <DialogDescription>
              El sublíder podrá registrar sus propios votantes y también será contado como votante
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubLeader} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document">Número de Cédula *</Label>
              <Input
                id="document"
                type="text"
                placeholder="Ej: 1234567890"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ej: Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Separator className="my-4" />
            <p className="text-sm font-medium">Información de Votación</p>

            <div className="space-y-2">
              <Label htmlFor="celular">Celular *</Label>
              <Input
                id="celular"
                type="tel"
                placeholder="Ej: 3001234567"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tel">Teléfono Fijo</Label>
              <Input
                id="tel"
                type="tel"
                placeholder="Ej: 6012345678"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ej: correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipality">Municipio *</Label>
              <Select value={municipalityId} onValueChange={setMunicipalityId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar municipio" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((mun) => (
                    <SelectItem key={mun.id} value={mun.id}>
                      {mun.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pollingStation">Puesto de Votación *</Label>
              <Select 
                value={pollingStationId} 
                onValueChange={setPollingStationId} 
                disabled={!municipalityId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar puesto" />
                </SelectTrigger>
                <SelectContent>
                  {pollingStations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableNumber">Número de Mesa *</Label>
              <Select 
                value={tableNumber} 
                onValueChange={setTableNumber} 
                disabled={!pollingStationId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mesa" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.number}>
                      Mesa {table.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? 'Creando...' : 'Crear Sublíder y Registrar como Votante'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
