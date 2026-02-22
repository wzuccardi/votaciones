'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Users,
  TrendingUp,
  MapPin,
  Search,
  UserCheck,
  LogOut,
  Phone,
  Smartphone,
  Mail,
  FileText,
  Shield,
  BarChart3,
  Pencil,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession, signOut } from 'next-auth/react'
import { generateGeneralReport, generateLeaderReport, generateMunicipalityReport, generatePollingStationReport } from '@/lib/pdf-generator'
import Link from 'next/link'

interface Leader {
  id: string
  document: string
  name: string
  parentLeaderId?: string | null
  parentLeader?: {
    id: string
    name: string
    document: string
  }
  subLeaders?: Leader[]
  _count?: {
    voters: number
    subLeaders: number
  }
}

interface Voter {
  id: string
  document: string
  name: string
  tel?: string
  celular?: string
  email?: string
  municipality?: string
  pollingStation?: string
  tableNumber?: string
  community?: string
  latitude?: number
  longitude?: number
  alcaldia?: string
  gobernacion?: string
  leader?: {
    name: string
  }
}

interface Stats {
  totalLeaders: number
  totalVoters: number
  votersByMunicipality: Array<{ name: string; count: number }>
  votersByDepartment: Array<{ name: string; count: number }>
  votersByPollingStation: Array<{ name: string; count: number; address?: string }>
  votersByLeader: Array<{ name: string; count: number }>
  votersWithGeolocation: number
}

// Componente recursivo para mostrar líderes en árbol
function LeaderTreeNode({ 
  leader, 
  level, 
  expandedLeaderId, 
  toggleLeaderExpansion, 
  leaderVoters,
  onEditLeader,
  onDeleteLeader
}: { 
  leader: any
  level: number
  expandedLeaderId: string | null
  toggleLeaderExpansion: (id: string) => void
  leaderVoters: Record<string, Voter[]>
  onEditLeader: (leader: any) => void
  onDeleteLeader: (leader: any) => void
}) {
  const isExpanded = expandedLeaderId === leader.id
  const hasSubLeaders = leader.subLeaders && leader.subLeaders.length > 0
  
  return (
    <div style={{ marginLeft: level > 0 ? '1.5rem' : '0' }}>
      <div
        className="rounded-lg border bg-card"
        style={{
          borderLeft: level > 0 ? '3px solid hsl(var(--primary))' : 'none'
        }}
      >
        <div 
          className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => toggleLeaderExpansion(leader.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">{leader.name}</p>
                {level > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Sublíder
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                CC: {leader.document}
              </p>
              {leader.parentLeader && (
                <p className="text-xs text-muted-foreground mt-1">
                  ↳ Sublíder de: {leader.parentLeader.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {leader._count?.voters || 0} votantes
              </Badge>
              {hasSubLeaders && (
                <Badge variant="outline" className="text-xs bg-primary/10">
                  {leader.subLeaders.length} sublíderes
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditLeader(leader)
                }}
                title="Editar líder"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteLeader(leader)
                }}
                title="Eliminar líder"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-6 w-6 p-0"
              >
                {isExpanded ? '▼' : '▶'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Lista de votantes expandida */}
        {isExpanded && (
          <div className="border-t bg-muted/20 p-3">
            {leaderVoters[leader.id] ? (
              leaderVoters[leader.id].length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Votantes de {leader.name}:
                  </p>
                  {leaderVoters[leader.id].map((voter) => (
                    <div 
                      key={voter.id}
                      className="p-2 rounded bg-background border text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{voter.name}</p>
                          <p className="text-muted-foreground">CC: {voter.document}</p>
                          {voter.municipality && (
                            <p className="text-muted-foreground mt-1">
                              📍 {voter.municipality}
                              {voter.pollingStation && ` - ${voter.pollingStation}`}
                            </p>
                          )}
                        </div>
                        {voter.celular && (
                          <Badge variant="secondary" className="text-xs">
                            📱 {voter.celular}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Este líder no tiene votantes registrados
                </p>
              )
            ) : (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                <p className="text-xs text-muted-foreground mt-1">Cargando votantes...</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Renderizar sublíderes recursivamente */}
      {hasSubLeaders && (
        <div className="mt-2 space-y-2">
          {leader.subLeaders.map((subLeader: any) => (
            <LeaderTreeNode
              key={subLeader.id}
              leader={subLeader}
              level={level + 1}
              expandedLeaderId={expandedLeaderId}
              toggleLeaderExpansion={toggleLeaderExpansion}
              leaderVoters={leaderVoters}
              onEditLeader={onEditLeader}
              onDeleteLeader={onDeleteLeader}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CandidateDashboard() {
  const { data: session, status } = useSession()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [allVoters, setAllVoters] = useState<Voter[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'document' | 'name' | 'location'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [branding, setBranding] = useState<{ primaryColor: string; secondaryColor: string; logoUrl: string; photoUrl: string }>({ primaryColor: '', secondaryColor: '', logoUrl: '', photoUrl: '' })
  const [expandedLeaderId, setExpandedLeaderId] = useState<string | null>(null)
  const [leaderVoters, setLeaderVoters] = useState<Record<string, Voter[]>>({})
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('')
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('')
  const [selectedPollingStationId, setSelectedPollingStationId] = useState<string>('')
  const [pollingStations, setPollingStations] = useState<any[]>([])
  const [municipalities, setMunicipalities] = useState<any[]>([])
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  // Estados para edición de líderes
  const [isEditLeaderDialogOpen, setIsEditLeaderDialogOpen] = useState(false)
  const [isDeleteLeaderDialogOpen, setIsDeleteLeaderDialogOpen] = useState(false)
  const [selectedLeaderForEdit, setSelectedLeaderForEdit] = useState<any>(null)
  const [selectedLeaderForDelete, setSelectedLeaderForDelete] = useState<any>(null)
  const [editLeaderForm, setEditLeaderForm] = useState({
    name: '',
    document: '',
    password: '',
    parentLeaderId: ''
  })
  const [isSubmittingLeader, setIsSubmittingLeader] = useState(false)

  useEffect(() => {
    if (isRedirecting) return
    if (status === 'authenticated' && session?.user) {
      setCurrentUser(session.user)
      fetchData((session.user as any).id)
      fetchBranding((session.user as any).id)
    } else if (status === 'unauthenticated') {
      setIsRedirecting(true)
      window.location.href = '/login'
    }
  }, [status, session, isRedirecting])

  useEffect(() => {
    if (!currentUser?.id) return
    const es = new EventSource(`/api/dashboard/candidate/branding/stream?candidateId=${currentUser.id}`)
    const onBranding = (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data || '{}')
        applyBranding(payload)
        setBranding({
          primaryColor: (payload.primaryColor?.includes('%') ? (() => {
            const parts = (payload.primaryColor || '').split(' ')
            if (parts.length !== 3) return ''
            const H = parseFloat(parts[0])
            const S = parseFloat(parts[1]) / 100
            const L = parseFloat(parts[2]) / 100
            const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1
              if (t > 1) t -= 1
              if (t < 1/6) return p + (q - p) * 6 * t
              if (t < 1/2) return q
              if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
              return p
            }
            const q = L < 0.5 ? L * (1 + S) : L + S - L * S
            const p = 2 * L - q
            const r = Math.round(hue2rgb(p, q, (H/360) + 1/3) * 255)
            const g = Math.round(hue2rgb(p, q, (H/360)) * 255)
            const b2 = Math.round(hue2rgb(p, q, (H/360) - 1/3) * 255)
            const toHex = (v: number) => v.toString(16).padStart(2, '0')
            return `#${toHex(r)}${toHex(g)}${toHex(b2)}`
          })() : payload.primaryColor) || '',
          secondaryColor: (payload.secondaryColor?.includes('%') ? (() => {
            const parts = (payload.secondaryColor || '').split(' ')
            if (parts.length !== 3) return ''
            const H = parseFloat(parts[0])
            const S = parseFloat(parts[1]) / 100
            const L = parseFloat(parts[2]) / 100
            const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1
              if (t > 1) t -= 1
              if (t < 1/6) return p + (q - p) * 6 * t
              if (t < 1/2) return q
              if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
              return p
            }
            const q = L < 0.5 ? L * (1 + S) : L + S - L * S
            const p = 2 * L - q
            const r = Math.round(hue2rgb(p, q, (H/360) + 1/3) * 255)
            const g = Math.round(hue2rgb(p, q, (H/360)) * 255)
            const b2 = Math.round(hue2rgb(p, q, (H/360) - 1/3) * 255)
            const toHex = (v: number) => v.toString(16).padStart(2, '0')
            return `#${toHex(r)}${toHex(g)}${toHex(b2)}`
          })() : payload.secondaryColor) || '',
          logoUrl: payload.logoUrl || '',
          photoUrl: payload.photoUrl || ''
        })
        const updatedUser = {
          ...currentUser,
          primaryColor: payload.primaryColor || null,
          secondaryColor: payload.secondaryColor || null,
          logoUrl: payload.logoUrl || null,
          photoUrl: payload.photoUrl || null
        }
        setCurrentUser(updatedUser)
      } catch {}
    }
    es.addEventListener('branding', onBranding as any)
    es.onerror = () => { /* keep alive */ }
    return () => {
      es.close()
    }
  }, [currentUser?.id])
  
  // Cargar municipios al montar el componente
  useEffect(() => {
    const loadMunicipalities = async () => {
      try {
        const res = await fetch('/api/data/municipalities')
        if (res.ok) {
          const data = await res.json()
          // El endpoint ahora retorna directamente el array
          if (Array.isArray(data)) setMunicipalities(data)
        }
      } catch (e) {
        console.error('Error loading municipalities:', e)
      }
    }
    loadMunicipalities()
  }, [])
  
  // Cargar puestos de votación cuando se selecciona un municipio
  useEffect(() => {
    const loadPollingStations = async () => {
      if (!selectedMunicipality) {
        setPollingStations([])
        setSelectedPollingStationId('')
        return
      }
      
      try {
        // Buscar el municipio por nombre para obtener su ID
        const municipality = municipalities.find(m => m.name === selectedMunicipality)
        if (!municipality) {
          console.error('Municipality not found:', selectedMunicipality)
          return
        }
        
        // Cargar puestos desde la API usando el ID del municipio
        const response = await fetch(`/api/data/polling-stations?municipalityId=${municipality.id}`)
        if (response.ok) {
          const data = await response.json()
          // El endpoint ahora retorna directamente el array
          if (Array.isArray(data)) {
            setPollingStations(data)
          }
        }
      } catch (error) {
        console.error('Error loading polling stations:', error)
      }
    }
    
    loadPollingStations()
  }, [selectedMunicipality, municipalities])
  
  const fetchData = async (candidateId: string) => {
    try {
      setIsLoading(true)

      // Fetch stats
      const statsResponse = await fetch(`/api/dashboard/candidate/stats?candidateId=${candidateId}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      // Fetch leaders
      const leadersResponse = await fetch(`/api/dashboard/candidate/leaders?candidateId=${candidateId}`)
      if (leadersResponse.ok) {
        const leadersData = await leadersResponse.json()
        setLeaders(leadersData.data)
      }

      // Fetch voters
      const votersResponse = await fetch(`/api/dashboard/candidate/voters?candidateId=${candidateId}`)
      if (votersResponse.ok) {
        const votersData = await votersResponse.json()
        setAllVoters(votersData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  // Organizar líderes en estructura de árbol
  const organizeLeadersHierarchy = () => {
    const leadersMap = new Map()
    const rootLeaders: any[] = []
    
    // Crear mapa de líderes
    leaders.forEach(leader => {
      leadersMap.set(leader.id, { ...leader, subLeaders: [] })
    })
    
    // Organizar jerarquía
    leaders.forEach(leader => {
      const leaderWithSubs = leadersMap.get(leader.id)
      if ((leader as any).parentLeaderId) {
        const parent = leadersMap.get((leader as any).parentLeaderId)
        if (parent) {
          parent.subLeaders.push(leaderWithSubs)
        } else {
          rootLeaders.push(leaderWithSubs)
        }
      } else {
        rootLeaders.push(leaderWithSubs)
      }
    })
    
    return rootLeaders
  }

  const fetchLeaderVoters = async (leaderId: string) => {
    try {
      const response = await fetch(`/api/dashboard/leader/voters?leaderId=${leaderId}`)
      if (response.ok) {
        const data = await response.json()
        setLeaderVoters(prev => ({ ...prev, [leaderId]: data.data || [] }))
      }
    } catch (error) {
      console.error('Error fetching leader voters:', error)
      toast.error('Error al cargar votantes del líder')
    }
  }

  const toggleLeaderExpansion = (leaderId: string) => {
    if (expandedLeaderId === leaderId) {
      setExpandedLeaderId(null)
    } else {
      setExpandedLeaderId(leaderId)
      if (!leaderVoters[leaderId]) {
        fetchLeaderVoters(leaderId)
      }
    }
  }

  const handleGenerateGeneralReport = async () => {
    try {
      setIsGeneratingPDF(true)
      toast.info('Generando reporte general...')
      
      const reportData = {
        candidateName: currentUser?.name || 'Candidato',
        candidateParty: 'Partido Político',
        totalLeaders: stats?.totalLeaders || 0,
        totalVoters: stats?.totalVoters || 0,
        leaders: leaders,
        voters: allVoters
      }
      
      generateGeneralReport(reportData)
      toast.success('Reporte general generado exitosamente')
      setIsReportDialogOpen(false)
    } catch (error) {
      console.error('Error generating general report:', error)
      toast.error('Error al generar el reporte general')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleGenerateLeaderReport = async () => {
    try {
      if (!selectedLeaderId) {
        toast.error('Por favor selecciona un líder')
        return
      }
      
      setIsGeneratingPDF(true)
      toast.info('Generando reporte del líder con sublíderes...')
      
      const leader = leaders.find(l => l.id === selectedLeaderId)
      if (!leader) {
        toast.error('Líder no encontrado')
        return
      }
      
      // Usar la API de jerarquía para obtener líder con sublíderes y todos sus votantes
      const response = await fetch(`/api/dashboard/leader/hierarchy?leaderId=${selectedLeaderId}`)
      if (!response.ok) {
        toast.error('Error al obtener datos del líder')
        return
      }
      
      const data = await response.json()
      if (!data.success) {
        toast.error('Error al obtener datos del líder')
        return
      }
      
      // Usar el generador de PDF jerárquico
      const { generateHierarchyPDF } = await import('@/lib/pdf-generator-hierarchy')
      const fileName = generateHierarchyPDF(data.data, currentUser?.name || 'Candidato')
      
      toast.success(`✅ Reporte generado: ${fileName}`)
      setIsReportDialogOpen(false)
    } catch (error) {
      console.error('Error generating leader report:', error)
      toast.error('Error al generar el reporte del líder')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleGenerateMunicipalityReport = async () => {
    try {
      if (!selectedMunicipality) {
        toast.error('Por favor selecciona un municipio')
        return
      }
      
      setIsGeneratingPDF(true)
      toast.info('Generando reporte del municipio...')
      
      const municipalityVoters = allVoters.filter(
        voter => voter.municipality === selectedMunicipality
      )
      
      generateMunicipalityReport(
        selectedMunicipality,
        municipalityVoters,
        currentUser?.name || 'Candidato'
      )
      
      toast.success('Reporte del municipio generado exitosamente')
      setIsReportDialogOpen(false)
    } catch (error) {
      console.error('Error generating municipality report:', error)
      toast.error('Error al generar el reporte del municipio')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleGeneratePollingStationReport = async () => {
    try {
      if (!selectedPollingStationId) {
        toast.error('Por favor selecciona un puesto de votación')
        return
      }
      
      setIsGeneratingPDF(true)
      toast.info('Generando reporte del puesto de votación...')
      
      // Buscar el puesto de votación seleccionado
      const pollingStation = pollingStations.find(ps => ps.id === selectedPollingStationId)
      if (!pollingStation) {
        toast.error('Puesto de votación no encontrado')
        setIsGeneratingPDF(false)
        return
      }
      
      // Filtrar votantes del puesto seleccionado (por nombre del puesto)
      const stationVoters = allVoters.filter(
        voter => voter.pollingStation === pollingStation.name
      )
      
      // Obtener testigos del puesto
      const witnessesResponse = await fetch(`/api/dashboard/candidate/witnesses?candidateId=${currentUser?.id}`)
      let witnesses = []
      if (witnessesResponse.ok) {
        const witnessesData = await witnessesResponse.json()
        witnesses = (witnessesData.data || []).filter(
          (w: any) => w.pollingStation?.id === selectedPollingStationId
        )
      }
      
      await generatePollingStationReport(
        {
          id: pollingStation.id,
          name: pollingStation.name,
          code: pollingStation.code || pollingStation.name,
          address: pollingStation.address,
          community: pollingStation.community,
          municipality: selectedMunicipality
        },
        stationVoters,
        witnesses,
        currentUser?.name || 'Candidato'
      )
      
      toast.success('Reporte del puesto de votación generado exitosamente')
      setIsReportDialogOpen(false)
    } catch (error) {
      console.error('Error generating polling station report:', error)
      toast.error('Error al generar el reporte del puesto de votación')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const fetchBranding = async (candidateId: string) => {
    try {
      const res = await fetch(`/api/dashboard/candidate/branding?candidateId=${candidateId}`)
      if (res.ok) {
        const data = await res.json()
        const b = data.data || {}
        const hslToHex = (h: string) => {
          const parts = (h || '').trim().split(' ')
          if (parts.length !== 3) return ''
          const H = parseFloat(parts[0])
          const S = parseFloat(parts[1].replace('%', '')) / 100
          const L = parseFloat(parts[2].replace('%', '')) / 100
          const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1/6) return p + (q - p) * 6 * t
            if (t < 1/2) return q
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
            return p
          }
          const q = L < 0.5 ? L * (1 + S) : L + S - L * S
          const p = 2 * L - q
          const r = Math.round(hue2rgb(p, q, (H/360) + 1/3) * 255)
          const g = Math.round(hue2rgb(p, q, (H/360)) * 255)
          const b2 = Math.round(hue2rgb(p, q, (H/360) - 1/3) * 255)
          const toHex = (v: number) => v.toString(16).padStart(2, '0')
          return `#${toHex(r)}${toHex(g)}${toHex(b2)}`
        }
        const toHexIfHsl = (v: string | null | undefined) => {
          const s = v || ''
          return s.includes('%') ? hslToHex(s) : s
        }
        setBranding({
          primaryColor: toHexIfHsl(b.primaryColor),
          secondaryColor: toHexIfHsl(b.secondaryColor),
          logoUrl: b.logoUrl || '',
          photoUrl: b.photoUrl || ''
        })
        applyBranding(b)
      }
    } catch {}
  }

  const hslTripleToHex = (triple: string) => {
    const parts = (triple || '').trim().split(' ')
    if (parts.length !== 3) return ''
    const H = parseFloat(parts[0])
    const S = parseFloat(parts[1].replace('%', '')) / 100
    const L = parseFloat(parts[2].replace('%', '')) / 100
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = L < 0.5 ? L * (1 + S) : L + S - L * S
    const p = 2 * L - q
    const r = Math.round(hue2rgb(p, q, (H/360) + 1/3) * 255)
    const g = Math.round(hue2rgb(p, q, (H/360)) * 255)
    const b2 = Math.round(hue2rgb(p, q, (H/360) - 1/3) * 255)
    const toHex = (v: number) => v.toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b2)}`
  }

  const applyBranding = (b: any) => {
    const root = document.documentElement
    const toHex = (v: any) => {
      const s = typeof v === 'string' ? v : ''
      return s.includes('%') ? hslTripleToHex(s) : s
    }
    const p = toHex(b.primaryColor)
    const s = toHex(b.secondaryColor)
    if (p) root.style.setProperty('--primary', p)
    if (s) root.style.setProperty('--secondary', s)
  }

  const handleSaveBranding = async () => {
    try {
      const body = {
        candidateId: currentUser?.id,
        primaryColor: branding.primaryColor || null,
        secondaryColor: branding.secondaryColor || null,
        logoUrl: branding.logoUrl || null,
        photoUrl: branding.photoUrl || null
      }
      const res = await fetch('/api/dashboard/candidate/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        const data = await res.json()
        applyBranding(data.data)
        const updatedUser = {
          ...currentUser,
          primaryColor: data.data?.primaryColor || null,
          secondaryColor: data.data?.secondaryColor || null,
          logoUrl: data.data?.logoUrl || null,
          photoUrl: data.data?.photoUrl || null
        }
        setCurrentUser(updatedUser)
        toast.success('Personalización actualizada')
      } else {
        toast.error('No se pudo actualizar la personalización')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  // Funciones para edición de líderes
  const handleEditLeader = (leader: any) => {
    setSelectedLeaderForEdit(leader)
    setEditLeaderForm({
      name: leader.name,
      document: leader.document,
      password: '',
      parentLeaderId: leader.parentLeaderId || ''
    })
    setIsEditLeaderDialogOpen(true)
  }

  const handleDeleteLeader = (leader: any) => {
    setSelectedLeaderForDelete(leader)
    setIsDeleteLeaderDialogOpen(true)
  }

  const submitEditLeader = async () => {
    if (!selectedLeaderForEdit || !editLeaderForm.name || !editLeaderForm.document) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setIsSubmittingLeader(true)
    try {
      const response = await fetch('/api/dashboard/candidate/leaders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId: selectedLeaderForEdit.id,
          name: editLeaderForm.name,
          document: editLeaderForm.document,
          password: editLeaderForm.password || undefined,
          parentLeaderId: editLeaderForm.parentLeaderId || null
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Líder actualizado exitosamente')
        setIsEditLeaderDialogOpen(false)
        setSelectedLeaderForEdit(null)
        setEditLeaderForm({ name: '', document: '', password: '', parentLeaderId: '' })
        // Recargar líderes
        fetchData(currentUser.id)
      } else {
        toast.error(data.message || 'Error al actualizar el líder')
      }
    } catch (error) {
      console.error('Error updating leader:', error)
      toast.error('Error al actualizar el líder')
    } finally {
      setIsSubmittingLeader(false)
    }
  }

  const confirmDeleteLeader = async () => {
    if (!selectedLeaderForDelete) return

    setIsSubmittingLeader(true)
    try {
      const response = await fetch('/api/dashboard/candidate/leaders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId: selectedLeaderForDelete.id
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Líder eliminado exitosamente')
        setIsDeleteLeaderDialogOpen(false)
        setSelectedLeaderForDelete(null)
        // Recargar líderes
        fetchData(currentUser.id)
      } else {
        toast.error(data.message || 'Error al eliminar el líder')
      }
    } catch (error) {
      console.error('Error deleting leader:', error)
      toast.error('Error al eliminar el líder')
    } finally {
      setIsSubmittingLeader(false)
    }
  }

  const filteredVoters = allVoters.filter(voter => {
    const query = searchQuery.toLowerCase()

    switch (filterBy) {
      case 'document':
        return voter.document.toLowerCase().includes(query)
      case 'name':
        return voter.name.toLowerCase().includes(query)
      case 'location':
        return voter.municipality?.toLowerCase().includes(query) ||
               voter.pollingStation?.toLowerCase().includes(query)
      default:
        return voter.document.toLowerCase().includes(query) ||
               voter.name.toLowerCase().includes(query) ||
               voter.municipality?.toLowerCase().includes(query) ||
               voter.pollingStation?.toLowerCase().includes(query)
    }
  })

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
          <p className="text-muted-foreground">Cargando dashboard...</p>
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
                  Partido Conservador - Es Confianza
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {branding.logoUrl && (
                <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 rounded" />
              )}
              <Badge variant="outline" className="hidden md:flex">
                <UserCheck className="w-3 h-3 mr-1" />
                Candidato
              </Badge>
              <Link href="/dashboard/candidate/testigos">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hidden md:flex"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Testigos Electorales
                </Button>
              </Link>
              <Link href="/dashboard/candidate/resultados">
                <Button 
                  variant="default" 
                  size="sm"
                  className="hidden md:flex"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Resultados en Vivo
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsReportDialogOpen(true)}
                className="hidden md:flex"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generar Reportes
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personalización de Campaña</CardTitle>
            <CardDescription>Colores, logo y foto del candidato</CardDescription>
          </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <p className="text-sm">Color Primario</p>
            <Input
              type="color"
              value={branding.primaryColor || '#000000'}
              onChange={(e) => {
                const val = e.target.value
                setBranding({ ...branding, primaryColor: val })
                applyBranding({ primaryColor: val, secondaryColor: branding.secondaryColor })
              }}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm">Color Secundario</p>
            <Input
              type="color"
              value={branding.secondaryColor || '#000000'}
              onChange={(e) => {
                const val = e.target.value
                setBranding({ ...branding, secondaryColor: val })
                applyBranding({ primaryColor: branding.primaryColor, secondaryColor: val })
              }}
            />
          </div>
          <div className="space-y-2">
            <Input placeholder="URL del logo" value={branding.logoUrl} onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Input placeholder="URL de foto del candidato" value={branding.photoUrl} onChange={(e) => setBranding({ ...branding, photoUrl: e.target.value })} />
          </div>
          <div className="md:col-span-4 flex items-center gap-3">
            <Button onClick={handleSaveBranding}>Guardar</Button>
            <Badge variant="outline" className="bg-primary/10">Vista previa primaria</Badge>
            <Badge variant="outline" className="bg-secondary/20">Vista previa secundaria</Badge>
            {branding.logoUrl && (
              <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 rounded border" />
            )}
          </div>
        </CardContent>
        </Card>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Líderes"
            value={stats?.totalLeaders || 0}
            icon={Users}
            description="Red de líderes activos"
          />
          <StatCard
            title="Total Votantes"
            value={stats?.totalVoters || 0}
            icon={UserCheck}
            description="Votantes registrados"
          />
          <StatCard
            title="Promedio por Líder"
            value={stats?.totalLeaders && stats.totalLeaders > 0
              ? Math.round(stats.totalVoters / stats.totalLeaders)
              : 0}
            icon={TrendingUp}
            description="Votantes por líder"
          />
          <StatCard
            title="Con Geolocalización"
            value={stats?.votersWithGeolocation || 0}
            icon={MapPin}
            description="Votantes con coordenadas"
          />
        </div>

        {/* Acceso Rápido a Resultados */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Resultados Electorales en Tiempo Real</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualiza votos, estadísticas y gráficas de los reportes de testigos
                  </p>
                </div>
              </div>
              <Link href="/dashboard/candidate/resultados">
                <Button size="lg" className="shadow-lg">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Ver Resultados
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaders List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Líderes</span>
                  <Badge variant="secondary">{leaders.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Red de líderes en tu campaña
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {leaders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay líderes registrados aún</p>
                      </div>
                    ) : (
                      organizeLeadersHierarchy().map((leader) => (
                        <LeaderTreeNode 
                          key={leader.id} 
                          leader={leader} 
                          level={0}
                          expandedLeaderId={expandedLeaderId}
                          toggleLeaderExpansion={toggleLeaderExpansion}
                          leaderVoters={leaderVoters}
                          onEditLeader={handleEditLeader}
                          onDeleteLeader={handleDeleteLeader}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Voters Search & List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Buscar Votantes
                  </span>
                  <Badge variant="secondary">{filteredVoters.length} / {allVoters.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Filtra votantes por cédula, nombre o zona de votación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Ingresa cédula, nombre o ubicación..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filterBy === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterBy('all')}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={filterBy === 'document' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterBy('document')}
                    >
                      Cédula
                    </Button>
                    <Button
                      variant={filterBy === 'name' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterBy('name')}
                    >
                      Nombre
                    </Button>
                    <Button
                      variant={filterBy === 'location' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterBy('location')}
                    >
                      Zona
                    </Button>
                  </div>
                </div>

                {/* Distribution Stats */}
                {(stats?.votersByMunicipality && stats.votersByMunicipality.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Distribución por Municipio</p>
                    <div className="flex flex-wrap gap-2">
                      {stats.votersByMunicipality.slice(0, 5).map((item) => (
                        <Badge key={item.name} variant="outline">
                          <MapPin className="w-3 h-3 mr-1" />
                          {item.name}: {item.count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(stats?.votersByDepartment && stats.votersByDepartment.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Distribución por Departamento</p>
                    <div className="flex flex-wrap gap-2">
                      {stats.votersByDepartment.slice(0, 5).map((item) => (
                        <Badge key={item.name} variant="outline" className="bg-primary/10">
                          {item.name}: {item.count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(stats?.votersByPollingStation && stats.votersByPollingStation.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Puestos de Votación más populares</p>
                    <div className="flex flex-wrap gap-2">
                      {stats.votersByPollingStation.slice(0, 5).map((item) => (
                        <Badge key={item.name} variant="outline" className="bg-secondary/20">
                          <UserCheck className="w-3 h-3 mr-1" />
                          {item.name}: {item.count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voters List */}
            <Card className="h-[500px] flex flex-col">
              <CardHeader>
                <CardTitle>Lista de Votantes</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-2">
                    {filteredVoters.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {searchQuery ? 'No se encontraron resultados' : 'No hay votantes registrados aún'}
                        </p>
                      </div>
                    ) : (
                      filteredVoters.map((voter) => (
                        <div
                          key={voter.id}
                          className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{voter.name}</p>
                              <p className="text-sm text-muted-foreground">
                                CC: {voter.document}
                              </p>
                            </div>
                          </div>

                          {(voter.tel || voter.celular || voter.email) && (
                            <>
                              <Separator className="my-2" />
                              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                {voter.tel && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {voter.tel}
                                  </span>
                                )}
                                {voter.celular && (
                                  <span className="flex items-center gap-1">
                                    <Smartphone className="w-3 h-3" />
                                    {voter.celular}
                                  </span>
                                )}
                                {voter.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {voter.email}
                                  </span>
                                )}
                              </div>
                            </>
                          )}

                          {(voter.municipality || voter.pollingStation) && (
                            <>
                              <Separator className="my-2" />
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                  {voter.municipality && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {voter.municipality}
                                    </span>
                                  )}
                                  {voter.pollingStation && (
                                    <span className="flex items-center gap-1">
                                      <UserCheck className="w-3 h-3" />
                                      {voter.pollingStation}
                                    </span>
                                  )}
                                  {voter.tableNumber && (
                                    <span className="flex items-center gap-1">
                                      Mesa {voter.tableNumber}
                                    </span>
                                  )}
                                </div>
                                {voter.community && (
                                  <div className="text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      Comuna: {voter.community}
                                    </span>
                                  </div>
                                )}
                                {voter.latitude && voter.longitude && (
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground bg-primary/5 px-2 py-1 rounded">
                                    <span className="flex items-center gap-1">
                                      📍 {voter.latitude.toFixed(4)}, {voter.longitude.toFixed(4)}
                                    </span>
                                  </div>
                                )}
                                {voter.alcaldia && (
                                  <div className="text-xs text-muted-foreground">
                                    Alcaldía: {voter.alcaldia}
                                  </div>
                                )}
                                {voter.gobernacion && (
                                  <div className="text-xs text-muted-foreground">
                                    Gobernación: {voter.gobernacion}
                                  </div>
                                )}
                              </div>
                            </>
                          )}

                          {voter.leader && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Líder: {voter.leader.name}
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground">
            © 2025 Gestión Electoral Colombia. Sistema de Organización Política.
          </p>
        </div>
      </footer>

      {/* Diálogo de Reportes */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Generar Reportes en PDF</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de reporte que deseas generar
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Reporte General */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reporte General de Campaña</CardTitle>
                <CardDescription>
                  Incluye todos los líderes y votantes con estadísticas completas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={handleGenerateGeneralReport}
                  disabled={isGeneratingPDF}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isGeneratingPDF ? 'Generando...' : 'Generar Reporte General'}
                </Button>
              </CardContent>
            </Card>

            {/* Reporte por Líder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reporte por Líder</CardTitle>
                <CardDescription>
                  Genera un reporte detallado de un líder específico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecciona un líder</Label>
                  <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un líder" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaders.map((leader) => (
                        <SelectItem key={leader.id} value={leader.id}>
                          {leader.name} ({leader._count?.voters || 0} votantes)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full"
                  onClick={handleGenerateLeaderReport}
                  disabled={isGeneratingPDF || !selectedLeaderId}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isGeneratingPDF ? 'Generando...' : 'Generar Reporte del Líder'}
                </Button>
              </CardContent>
            </Card>

            {/* Reporte por Municipio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reporte por Municipio</CardTitle>
                <CardDescription>
                  Genera un reporte filtrado por municipio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecciona un municipio</Label>
                  <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un municipio" />
                    </SelectTrigger>
                    <SelectContent>
                      {stats?.votersByMunicipality.map((mun) => (
                        <SelectItem key={mun.name} value={mun.name}>
                          {mun.name} ({mun.count} votantes)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full"
                  onClick={handleGenerateMunicipalityReport}
                  disabled={isGeneratingPDF || !selectedMunicipality}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isGeneratingPDF ? 'Generando...' : 'Generar Reporte del Municipio'}
                </Button>
              </CardContent>
            </Card>

            {/* Reporte por Puesto de Votación */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reporte por Puesto de Votación</CardTitle>
                <CardDescription>
                  Organiza las mesas de mayor a menor número de votantes con cobertura de testigos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecciona un municipio</Label>
                  <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un municipio" />
                    </SelectTrigger>
                    <SelectContent>
                      {stats?.votersByMunicipality.map((mun) => (
                        <SelectItem key={mun.name} value={mun.name}>
                          {mun.name} ({mun.count} votantes)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Selecciona un puesto de votación</Label>
                  <Select 
                    value={selectedPollingStationId} 
                    onValueChange={setSelectedPollingStationId}
                    disabled={!selectedMunicipality}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedMunicipality ? "Selecciona un puesto" : "Primero selecciona un municipio"} />
                    </SelectTrigger>
                    <SelectContent>
                      {pollingStations.map((station) => {
                        const voterCount = allVoters.filter(v => v.pollingStation === station.name).length
                        return (
                          <SelectItem key={station.id} value={station.id}>
                            {station.name} ({voterCount} votantes)
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full"
                  onClick={handleGeneratePollingStationReport}
                  disabled={isGeneratingPDF || !selectedPollingStationId}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isGeneratingPDF ? 'Generando...' : 'Generar Reporte del Puesto'}
                </Button>
              </CardContent>
            </Card>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Edición de Líder */}
      <Dialog open={isEditLeaderDialogOpen} onOpenChange={setIsEditLeaderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Líder</DialogTitle>
            <DialogDescription>
              Actualiza la información del líder
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre Completo *</Label>
              <Input
                id="edit-name"
                value={editLeaderForm.name}
                onChange={(e) => setEditLeaderForm({ ...editLeaderForm, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-document">Documento *</Label>
              <Input
                id="edit-document"
                value={editLeaderForm.document}
                onChange={(e) => setEditLeaderForm({ ...editLeaderForm, document: e.target.value })}
                placeholder="Número de documento"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editLeaderForm.password}
                onChange={(e) => setEditLeaderForm({ ...editLeaderForm, password: e.target.value })}
                placeholder="Dejar vacío para mantener la actual"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-parent">Líder Padre (opcional)</Label>
              <Select
                value={editLeaderForm.parentLeaderId}
                onValueChange={(value) => setEditLeaderForm({ ...editLeaderForm, parentLeaderId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar líder padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno (Líder Principal)</SelectItem>
                  {leaders
                    .filter(l => l.id !== selectedLeaderForEdit?.id && !l.parentLeaderId)
                    .map((leader) => (
                      <SelectItem key={leader.id} value={leader.id}>
                        {leader.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditLeaderDialogOpen(false)}
              disabled={isSubmittingLeader}
            >
              Cancelar
            </Button>
            <Button
              onClick={submitEditLeader}
              disabled={isSubmittingLeader}
            >
              {isSubmittingLeader ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={isDeleteLeaderDialogOpen} onOpenChange={setIsDeleteLeaderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Líder</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este líder?
            </DialogDescription>
          </DialogHeader>
          
          {selectedLeaderForDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedLeaderForDelete.name}</p>
                <p className="text-sm text-muted-foreground">CC: {selectedLeaderForDelete.document}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    • {selectedLeaderForDelete._count?.voters || 0} votantes
                  </p>
                  <p className="text-sm">
                    • {selectedLeaderForDelete._count?.subLeaders || 0} sublíderes
                  </p>
                </div>
              </div>
              
              {(selectedLeaderForDelete._count?.voters > 0 || selectedLeaderForDelete._count?.subLeaders > 0) && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ No se puede eliminar este líder
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Primero debes eliminar o reasignar sus votantes y sublíderes.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteLeaderDialogOpen(false)}
              disabled={isSubmittingLeader}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteLeader}
              disabled={
                isSubmittingLeader ||
                (selectedLeaderForDelete?._count?.voters > 0) ||
                (selectedLeaderForDelete?._count?.subLeaders > 0)
              }
            >
              {isSubmittingLeader ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
