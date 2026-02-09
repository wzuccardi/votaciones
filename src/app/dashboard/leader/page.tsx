'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Toast } from '@/components/ui/toast'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import { SubLeadersManager } from '@/components/SubLeadersManager'
import {
  Users,
  MapPin,
  Search,
  UserCheck,
  LogOut,
  Plus,
  Phone,
  Smartphone,
  Mail,
  Star,
  Shield,
  Clock,
  Car,
  AlertCircle,
  Settings,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

interface Voter {
  id: string
  document: string
  name: string
  tel?: string
  celular?: string
  email?: string
  municipality?: string
  municipalityId?: string | null
  pollingStation?: string
  pollingStationId?: string | null
  tableNumber?: string
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

export default function LeaderDashboard() {
  const { data: session, status } = useSession()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [voters, setVoters] = useState<Voter[]>([])
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'document' | 'name' | 'location'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [municipalities, setMunicipalities] = useState<any[]>([])
  const [pollingStations, setPollingStations] = useState<any[]>([])
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<string>('')
  const [zones, setZones] = useState<string[]>([])
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [selectedPollingStationId, setSelectedPollingStationId] = useState<string>('')
  const [tables, setTables] = useState<any[]>([])

  // Estados para testigos electorales
  const [isWitnessDialogOpen, setIsWitnessDialogOpen] = useState(false)
  const [selectedVoterForWitness, setSelectedVoterForWitness] = useState<Voter | null>(null)
  const [witnesses, setWitnesses] = useState<ElectoralWitness[]>([])
  const [witnessPollingStations, setWitnessPollingStations] = useState<any[]>([])
  const [witnessSelectedPollingStationId, setWitnessSelectedPollingStationId] = useState<string>('')
  const [availableTables, setAvailableTables] = useState<number[]>([])
  const [selectedTables, setSelectedTables] = useState<number[]>([])
  const [witnessForm, setWitnessForm] = useState({
    experience: 'FIRST_TIME' as 'FIRST_TIME' | 'EXPERIENCED',
    availability: 'FULL_DAY' as 'FULL_DAY' | 'MORNING' | 'AFTERNOON',
    hasTransport: false,
    emergencyContact: '',
    notes: ''
  })

  // Estados para configuración
  const [useComboboxForPollingStations, setUseComboboxForPollingStations] = useState(false)

  const [newVoterForm, setNewVoterForm] = useState({
    document: '',
    name: '',
    tel: '',
    celular: '',
    email: '',
    municipality: '',
    pollingStation: '',
    tableNumber: ''
  })
  const [editVoterForm, setEditVoterForm] = useState({
    document: '',
    name: '',
    tel: '',
    celular: '',
    email: '',
    municipality: '',
    pollingStation: '',
    tableNumber: ''
  })

  useEffect(() => {
    const loadMunicipalities = async () => {
      try {
        const res = await fetch('/api/data/municipalities')
        if (res.ok) {
          const data = await res.json()
          if (data.success) setMunicipalities(data.data || [])
        }
      } catch (e) {
        console.error('Error loading municipalities:', e)
      }
    }
    loadMunicipalities()
  }, [])

  useEffect(() => {
    const loadStations = async () => {
      if (!selectedMunicipalityId) return
      try {
        const res = await fetch(`/api/data/polling-stations?municipalityId=${selectedMunicipalityId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setPollingStations(data.data || [])
            const uniqueZones = Array.from(new Set((data.data || []).map((s: any) => s.community).filter((z: string | null) => !!z)))
            setZones(uniqueZones as string[])
            setSelectedZone('')
            setNewVoterForm({ ...newVoterForm, pollingStation: '' })
          }
        }
      } catch (e) {}
    }
    loadStations()
  }, [selectedMunicipalityId])

  useEffect(() => {
    const loadTables = async () => {
      if (!selectedPollingStationId) return
      try {
        const res = await fetch(`/api/data/tables?pollingStationId=${selectedPollingStationId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) setTables(data.data || [])
        }
      } catch (e) {}
    }
    loadTables()
  }, [selectedPollingStationId])

  useEffect(() => {
    const loadPollingStations = async () => {
      if (!newVoterForm.municipality) {
        setPollingStations([])
        return
      }
      const m = municipalities.find((x: any) => x.name === newVoterForm.municipality)
      if (!m) {
        setPollingStations([])
        return
      }
      try {
        const res = await fetch(`/api/data/polling-stations?municipalityId=${m.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) setPollingStations(data.data || [])
        }
      } catch (e) {
        setPollingStations([])
      }
    }
    loadPollingStations()
  }, [newVoterForm.municipality, municipalities])

  useEffect(() => {
    if (isRedirecting) return
    if (status === 'authenticated' && session?.user) {
      setCurrentUser(session.user)
      fetchLeaderData((session.user as any).id)
    } else if (status === 'unauthenticated') {
      setIsRedirecting(true)
      window.location.href = '/login'
    }
  }, [status, session, isRedirecting])

  useEffect(() => {
    const candidateId = candidate?.id || currentUser?.candidate?.id
    if (!candidateId) return
    const es = new EventSource(`/api/dashboard/candidate/branding/stream?candidateId=${candidateId}`)
    const onBranding = (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data || '{}')
        const root = document.documentElement
        const normalize = (v: any) => {
          const s = typeof v === 'string' ? v : ''
          if (!s) return ''
          if (s.startsWith('#')) {
            const m = s.replace('#', '')
            if (m.length !== 6) return ''
            const r = parseInt(m.substring(0, 2), 16) / 255
            const g = parseInt(m.substring(2, 4), 16) / 255
            const b = parseInt(m.substring(4, 6), 16) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s2 = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s2 = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r:
                  h = (g - b) / d + (g < b ? 6 : 0)
                  break
                case g:
                  h = (b - r) / d + 2
                  break
                default:
                  h = (r - g) / d + 4
              }
              h /= 6
            }
            const H = Math.round(h * 360)
            const S = Math.round(s2 * 100)
            const L = Math.round(l * 100)
            return `${H} ${S}% ${L}%`
          }
          return s
        }
        if (payload.primaryColor) root.style.setProperty('--primary', normalize(payload.primaryColor))
        if (payload.secondaryColor) root.style.setProperty('--secondary', normalize(payload.secondaryColor))
      } catch {}
    }
    es.addEventListener('branding', onBranding as any)
    es.onerror = () => { /* keep alive */ }
    return () => es.close()
  }, [candidate?.id, currentUser?.candidate?.id])

  // Cargar testigos electorales
  useEffect(() => {
    if (currentUser?.id) {
      fetchWitnesses()
    }
  }, [currentUser?.id])

  // Cargar puestos de votación para testigos (filtrados por municipio del votante)
  useEffect(() => {
    const loadWitnessPollingStations = async () => {
      if (!selectedVoterForWitness?.municipalityId) {
        setWitnessPollingStations([])
        return
      }
      
      try {
        // Cargar solo puestos del municipio del votante
        const res = await fetch(`/api/data/polling-stations?municipalityId=${selectedVoterForWitness.municipalityId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setWitnessPollingStations(data.data || [])
            // Si el votante ya tiene un puesto asignado, preseleccionarlo
            if (selectedVoterForWitness.pollingStationId) {
              setWitnessSelectedPollingStationId(selectedVoterForWitness.pollingStationId)
            }
          }
        }
      } catch (e) {
        console.error('Error loading witness polling stations:', e)
      }
    }
    loadWitnessPollingStations()
  }, [selectedVoterForWitness])

  // Cargar mesas disponibles cuando se selecciona un puesto para testigo
  useEffect(() => {
    const loadAvailableTables = async () => {
      if (!witnessSelectedPollingStationId) {
        setAvailableTables([])
        return
      }
      try {
        const res = await fetch(`/api/data/tables?pollingStationId=${witnessSelectedPollingStationId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            const tableNumbers = (data.data || []).map((t: any) => parseInt(t.number)).filter((n: number) => !isNaN(n))
            setAvailableTables(tableNumbers)
          }
        }
      } catch (e) {
        console.error('Error loading available tables:', e)
      }
    }
    loadAvailableTables()
  }, [witnessSelectedPollingStationId])

  const fetchWitnesses = async () => {
    if (!currentUser?.id) return
    try {
      const res = await fetch(`/api/dashboard/leader/witnesses?leaderId=${currentUser.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) setWitnesses(data.data || [])
      }
    } catch (e) {
      console.error('Error fetching witnesses:', e)
    }
  }

  const openWitnessDialog = (voter: Voter) => {
    // Verificar si el votante ya es testigo
    const existingWitness = witnesses.find(w => w.voter.id === voter.id)
    if (existingWitness) {
      toast.error('Este votante ya es testigo electoral')
      return
    }

    // Verificar que el votante tenga municipio asignado
    if (!voter.municipalityId) {
      toast.error('El votante debe tener un municipio asignado para ser testigo')
      return
    }

    setSelectedVoterForWitness(voter)
    // Resetear estados
    setWitnessPollingStations([])
    setWitnessSelectedPollingStationId('')
    setSelectedTables([])
    setAvailableTables([])
    setWitnessForm({
      experience: 'FIRST_TIME',
      availability: 'FULL_DAY',
      hasTransport: false,
      emergencyContact: '',
      notes: ''
    })
    setIsWitnessDialogOpen(true)
  }

  const handleWitnessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVoterForWitness || !currentUser?.id) return

    if (!witnessSelectedPollingStationId) {
      toast.error('Debe seleccionar un puesto de votación')
      return
    }

    if (selectedTables.length === 0) {
      toast.error('Debe seleccionar al menos una mesa')
      return
    }

    if (selectedTables.length > 5) {
      toast.error('Máximo 5 mesas por testigo')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/dashboard/leader/witnesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId: currentUser.id,
          voterId: selectedVoterForWitness.id,
          pollingStationId: witnessSelectedPollingStationId,
          assignedTables: selectedTables,
          experience: witnessForm.experience,
          availability: witnessForm.availability,
          hasTransport: witnessForm.hasTransport,
          emergencyContact: witnessForm.emergencyContact || undefined,
          notes: witnessForm.notes || undefined
        })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('¡Testigo electoral asignado exitosamente!')
        setIsWitnessDialogOpen(false)
        setSelectedVoterForWitness(null)
        fetchWitnesses()
      } else {
        toast.error(data.error || 'Error al asignar testigo')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTableToggle = (tableNumber: number) => {
    setSelectedTables(prev => {
      if (prev.includes(tableNumber)) {
        return prev.filter(t => t !== tableNumber)
      } else if (prev.length < 5) {
        return [...prev, tableNumber].sort((a, b) => a - b)
      } else {
        toast.error('Máximo 5 mesas por testigo')
        return prev
      }
    })
  }
  const fetchLeaderData = async (leaderId: string) => {
    try {
      setIsLoading(true)

      // Fetch voters
      const votersResponse = await fetch(`/api/dashboard/leader/voters?leaderId=${leaderId}`)
      if (votersResponse.ok) {
        const votersData = await votersResponse.json()
        setVoters(votersData.data || [])
      }

      // Fetch candidate info
      const candidateResponse = await fetch(`/api/dashboard/leader/candidate?leaderId=${leaderId}`)
      if (candidateResponse.ok) {
        const candidateData = await candidateResponse.json()
        setCandidate(candidateData.data)
        const c = candidateData.data
        if (c?.primaryColor || c?.secondaryColor) {
          const root = document.documentElement
          const normalize = (v: any) => {
            const s = typeof v === 'string' ? v : ''
            if (!s) return ''
            if (s.startsWith('#')) {
              const m = s.replace('#', '')
              if (m.length !== 6) return ''
              const r = parseInt(m.substring(0, 2), 16) / 255
              const g = parseInt(m.substring(2, 4), 16) / 255
              const b = parseInt(m.substring(4, 6), 16) / 255
              const max = Math.max(r, g, b)
              const min = Math.min(r, g, b)
              let h = 0
              let s2 = 0
              const l = (max + min) / 2
              if (max !== min) {
                const d = max - min
                s2 = l > 0.5 ? d / (2 - max - min) : d / (max + min)
                switch (max) {
                  case r:
                    h = (g - b) / d + (g < b ? 6 : 0)
                    break
                  case g:
                    h = (b - r) / d + 2
                    break
                  default:
                    h = (r - g) / d + 4
                }
                h /= 6
              }
              const H = Math.round(h * 360)
              const S = Math.round(s2 * 100)
              const L = Math.round(l * 100)
              return `${H} ${S}% ${L}%`
            }
            return s
          }
          if (c.primaryColor) root.style.setProperty('--primary', normalize(c.primaryColor))
          if (c.secondaryColor) root.style.setProperty('--secondary', normalize(c.secondaryColor))
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddVoter = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const onlyDigits = /^\d+$/
      if (!onlyDigits.test(newVoterForm.document)) {
        toast.error('La cédula debe contener solo números')
        setIsSubmitting(false)
        return
      }
      if (!newVoterForm.name.trim()) {
        toast.error('El nombre es obligatorio')
        setIsSubmitting(false)
        return
      }
      if (!newVoterForm.tel.trim() && !newVoterForm.celular.trim()) {
        toast.error('Debe proporcionar al menos un teléfono de contacto')
        setIsSubmitting(false)
        return
      }
      if (newVoterForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newVoterForm.email)) {
        toast.error('Correo electrónico inválido')
        setIsSubmitting(false)
        return
      }
      if (!selectedMunicipalityId) {
        toast.error('El municipio es obligatorio')
        setIsSubmitting(false)
        return
      }
      if (!selectedPollingStationId) {
        toast.error('El puesto de votación es obligatorio')
        setIsSubmitting(false)
        return
      }
      if (!newVoterForm.tableNumber) {
        toast.error('El número de mesa es obligatorio')
        setIsSubmitting(false)
        return
      }
      if (newVoterForm.tableNumber && !onlyDigits.test(newVoterForm.tableNumber)) {
        toast.error('El número de mesa debe ser numérico')
        setIsSubmitting(false)
        return
      }
      const response = await fetch('/api/dashboard/leader/voters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId: currentUser?.id,
          document: newVoterForm.document,
          name: newVoterForm.name,
          tel: newVoterForm.tel || undefined,
          celular: newVoterForm.celular || undefined,
          email: newVoterForm.email || undefined,
          municipalityId: selectedMunicipalityId || undefined,
          pollingStationId: selectedPollingStationId || undefined,
          tableNumber: newVoterForm.tableNumber || undefined
        })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('¡Votante registrado exitosamente!')
        setIsAddDialogOpen(false)
        setNewVoterForm({ document: '', name: '', tel: '', celular: '', email: '', municipality: '', pollingStation: '', tableNumber: '' })
        fetchLeaderData(currentUser.id)
      } else {
        toast.error(data.message || data.error || 'Error al registrar votante')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditVoter = (voter: Voter) => {
    setEditingVoter(voter)
    setEditVoterForm({
      document: voter.document,
      name: voter.name,
      tel: voter.tel || '',
      celular: voter.celular || '',
      email: voter.email || '',
      municipality: voter.municipality || '',
      pollingStation: voter.pollingStation || '',
      tableNumber: voter.tableNumber || ''
    })
    // Establecer los IDs seleccionados para los selectores
    if (voter.municipalityId) {
      setSelectedMunicipalityId(voter.municipalityId)
      // Cargar puestos de votación del municipio
      loadPollingStationsForEdit(voter.municipalityId, voter.pollingStationId)
    }
    if (voter.pollingStationId) {
      // Cargar mesas del puesto
      loadTablesForEdit(voter.pollingStationId)
    }
    setIsEditDialogOpen(true)
  }

  const loadPollingStationsForEdit = async (municipalityId: string, pollingStationId?: string | null) => {
    try {
      const res = await fetch(`/api/data/polling-stations?municipalityId=${municipalityId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setPollingStations(data.data || [])
          if (pollingStationId) {
            setSelectedPollingStationId(pollingStationId)
          }
        }
      }
    } catch (e) {
      console.error('Error loading polling stations:', e)
    }
  }

  const loadTablesForEdit = async (pollingStationId: string) => {
    try {
      const res = await fetch(`/api/data/tables?pollingStationId=${pollingStationId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) setTables(data.data || [])
      }
    } catch (e) {
      console.error('Error loading tables:', e)
    }
  }

  const handleEditVoter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVoter) return
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/dashboard/leader/voters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId: currentUser?.id,
          voterId: editingVoter.id,
          document: editVoterForm.document || undefined,
          name: editVoterForm.name || undefined,
          tel: editVoterForm.tel || undefined,
          celular: editVoterForm.celular || undefined,
          email: editVoterForm.email || undefined,
          municipalityId: selectedMunicipalityId || undefined,
          pollingStationId: selectedPollingStationId || undefined,
          tableNumber: editVoterForm.tableNumber || undefined
        })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Votante actualizado')
        setIsEditDialogOpen(false)
        setEditingVoter(null)
        fetchLeaderData(currentUser.id)
      } else {
        toast.error(data.message || data.error || 'Error al actualizar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteVoter = async (voterId: string) => {
    const ok = window.confirm('¿Eliminar este votante? Esta acción no se puede deshacer.')
    if (!ok) return
    try {
      const response = await fetch('/api/dashboard/leader/voters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId: currentUser?.id,
          voterId
        })
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        toast.success('Votante eliminado')
        fetchLeaderData(currentUser.id)
      } else {
        toast.error((data && (data.message || data.error)) || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  const filteredVoters = voters.filter(voter => {
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
                  Líder: {currentUser?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/leader/monitoreo">
                <Button variant="default" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Monitoreo en Tiempo Real
                </Button>
              </Link>
              <Link href="/dashboard/leader/testigos">
                <Button variant="outline" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Testigos ({witnesses.length})
                </Button>
              </Link>
              {candidate?.logoUrl && (
                <img src={candidate.logoUrl} alt="Logo" className="w-8 h-8 rounded" />
              )}
              <Badge variant="outline" className="hidden md:flex">
                <UserCheck className="w-3 h-3 mr-1" />
                Líder
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setUseComboboxForPollingStations(!useComboboxForPollingStations)}
                title="Configurar búsqueda de puestos"
              >
                <Settings className="w-4 h-4" />
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Votantes"
            value={voters.length}
            icon={Users}
            description="Votantes registrados"
          />
          <StatCard
            title="Testigos Electorales"
            value={witnesses.length}
            icon={Shield}
            description="Testigos asignados"
          />
          <StatCard
            title="Campaña"
            value={candidate?.name || 'N/A'}
            icon={UserCheck}
            description={candidate?.party}
          />
        </div>

        {/* Acceso Rápido al Monitoreo */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Dashboard de Monitoreo en Tiempo Real</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualiza estadísticas, gráficas y reportes de votación en tiempo real
                  </p>
                </div>
              </div>
              <Link href="/dashboard/leader/monitoreo">
                <Button size="lg" className="shadow-lg">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Ir al Monitoreo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Add Voter Button - Prominent */}
        <div className="mb-6 flex justify-between items-center">
          <Link href="/dashboard/leader/testigos">
            <Button 
              variant="outline"
              size="lg" 
              className="shadow-lg hover:opacity-90 transition-opacity"
            >
              <Shield className="w-5 h-5 mr-2" />
              Ver Testigos Electorales ({witnesses.length})
            </Button>
          </Link>
          <Button 
            onClick={() => setIsAddDialogOpen(true)} 
            size="lg" 
            style={{ 
              backgroundColor: '#2563eb', 
              color: '#ffffff',
              fontWeight: 600,
              border: 'none'
            }}
            className="shadow-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5 mr-2" style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff' }}>Agregar Nuevo Votante</span>
          </Button>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Buscar Votantes
                </CardTitle>
                <CardDescription className="mt-1">
                  Filtra votantes por cédula, nombre o zona de votación
                </CardDescription>
              </div>
              <Badge variant="secondary">{filteredVoters.length} / {voters.length}</Badge>
            </div>
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
          </CardContent>
        </Card>

        {/* SubLeaders Manager */}
        {currentUser && (
          <SubLeadersManager 
            leaderId={currentUser.id}
            leaderName={currentUser.name}
            candidateName={candidate?.name || 'Candidato'}
          />
        )}

        {/* Voters List */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Mis Votantes</CardTitle>
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{voter.name}</p>
                            {witnesses.find(w => w.voter.id === voter.id) && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Testigo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            CC: {voter.document}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditVoter(voter)}>Editar</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteVoter(voter.id)}>Eliminar</Button>
                          {!witnesses.find(w => w.voter.id === voter.id) ? (
                            <Button 
                              size="sm" 
                              variant="default" 
                              onClick={() => openWitnessDialog(voter)}
                              style={{ 
                                backgroundColor: '#f59e0b', 
                                color: '#ffffff',
                                border: 'none'
                              }}
                              className="hover:opacity-90"
                            >
                              <Star className="w-3 h-3 mr-1" style={{ color: '#ffffff' }} />
                              <span style={{ color: '#ffffff' }}>Designar Testigo</span>
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              disabled
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              Ya es Testigo
                            </Button>
                          )}
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
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>

      {/* Add Voter Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Votante</DialogTitle>
            <DialogDescription>
              Ingresa los datos del votante para registrarlo en tu red
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddVoter} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-voter-document">Número de Cédula *</Label>
              <Input
                id="new-voter-document"
                type="text"
                placeholder="Ej: 1234567890"
                value={newVoterForm.document}
                onChange={(e) => setNewVoterForm({ ...newVoterForm, document: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-voter-name">Nombre Completo *</Label>
              <Input
                id="new-voter-name"
                type="text"
                placeholder="Ej: Carlos Rodríguez"
                value={newVoterForm.name}
                onChange={(e) => setNewVoterForm({ ...newVoterForm, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-voter-tel">Teléfono *</Label>
                <Input
                  id="new-voter-tel"
                  type="text"
                  placeholder="Ej: 6015550000"
                  value={newVoterForm.tel}
                  onChange={(e) => setNewVoterForm({ ...newVoterForm, tel: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-voter-cel">Celular *</Label>
                <Input
                  id="new-voter-cel"
                  type="text"
                  placeholder="Ej: 3005550000"
                  value={newVoterForm.celular}
                  onChange={(e) => setNewVoterForm({ ...newVoterForm, celular: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-voter-email">Correo electrónico *</Label>
                <Input
                  id="new-voter-email"
                  type="email"
                  placeholder="Ej: nombre@correo.com"
                  value={newVoterForm.email}
                  onChange={(e) => setNewVoterForm({ ...newVoterForm, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-voter-municipality">Municipio (Bolívar) *</Label>
              <Select value={selectedMunicipalityId} onValueChange={(value) => {
                setSelectedMunicipalityId(value)
              }} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el municipio" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.length > 0 ? (
                    municipalities.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No hay municipios disponibles</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-voter-zone">Zona/Comuna</Label>
              <Select value={selectedZone} onValueChange={(value) => setSelectedZone(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por zona/comuna (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {zones.length > 0 ? (
                    zones.map((z) => (
                      <SelectItem key={z} value={z}>{z}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No hay zonas disponibles</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-voter-polling">Puesto de Votación *</Label>
              {useComboboxForPollingStations ? (
                <Combobox
                  options={((selectedZone ? pollingStations.filter((s: any) => s.community === selectedZone) : pollingStations)).map((station: any) => ({
                    value: station.id,
                    label: station.name,
                    subtitle: station.community ? `${station.community}${station.address ? ` - ${station.address}` : ''}` : station.address
                  }))}
                  value={selectedPollingStationId}
                  onValueChange={setSelectedPollingStationId}
                  placeholder={
                    pollingStations.length > 0 
                      ? "Buscar puesto de votación..." 
                      : "Primero selecciona un municipio"
                  }
                  searchPlaceholder="Buscar por nombre o zona..."
                  emptyMessage="No se encontraron puestos de votación"
                  disabled={pollingStations.length === 0}
                />
              ) : (
                <Select value={selectedPollingStationId} onValueChange={(value) => {
                  setSelectedPollingStationId(value)
                }} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el puesto de votación" />
                  </SelectTrigger>
                  <SelectContent>
                    {pollingStations.length > 0 ? (
                      ((selectedZone ? pollingStations.filter((s: any) => s.community === selectedZone) : pollingStations)).map((station: any) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">Primero selecciona un municipio</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-voter-table">Mesa *</Label>
              <Select 
                value={newVoterForm.tableNumber} 
                onValueChange={(value) => setNewVoterForm({ ...newVoterForm, tableNumber: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la mesa" />
                </SelectTrigger>
                <SelectContent>
                  {tables.length > 0 ? (
                    tables.map((t: any) => (
                      <SelectItem key={t.number} value={t.number}>{t.number}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No hay mesas disponibles</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              style={{ 
                backgroundColor: '#2563eb', 
                color: '#ffffff',
                fontWeight: 600,
                border: 'none'
              }}
            >
              <span style={{ color: '#ffffff' }}>
                {isSubmitting ? 'Registrando...' : 'Registrar Votante'}
              </span>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Voter Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Votante</DialogTitle>
            <DialogDescription>Actualiza la información del votante</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditVoter} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-voter-document">Número de Cédula *</Label>
              <Input 
                id="edit-voter-document"
                placeholder="Cédula" 
                value={editVoterForm.document} 
                onChange={(e) => setEditVoterForm({ ...editVoterForm, document: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-voter-name">Nombre Completo *</Label>
              <Input 
                id="edit-voter-name"
                placeholder="Nombre completo" 
                value={editVoterForm.name} 
                onChange={(e) => setEditVoterForm({ ...editVoterForm, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-voter-tel">Teléfono *</Label>
                <Input 
                  id="edit-voter-tel"
                  placeholder="Teléfono" 
                  value={editVoterForm.tel} 
                  onChange={(e) => setEditVoterForm({ ...editVoterForm, tel: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-voter-celular">Celular *</Label>
                <Input 
                  id="edit-voter-celular"
                  placeholder="Celular" 
                  value={editVoterForm.celular} 
                  onChange={(e) => setEditVoterForm({ ...editVoterForm, celular: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-voter-email">Email *</Label>
                <Input 
                  id="edit-voter-email"
                  placeholder="Email" 
                  type="email" 
                  value={editVoterForm.email} 
                  onChange={(e) => setEditVoterForm({ ...editVoterForm, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-voter-municipality">Municipio (Bolívar) *</Label>
              <Select 
                value={selectedMunicipalityId} 
                onValueChange={(value) => {
                  setSelectedMunicipalityId(value)
                  setSelectedPollingStationId('') // Reset polling station when municipality changes
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el municipio" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.length > 0 ? (
                    municipalities.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No hay municipios disponibles</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-voter-polling">Puesto de Votación *</Label>
              <Combobox
                options={pollingStations.map((station: any) => ({
                  value: station.id,
                  label: station.name,
                  subtitle: station.community ? `${station.community}${station.address ? ` - ${station.address}` : ''}` : station.address
                }))}
                value={selectedPollingStationId}
                onValueChange={setSelectedPollingStationId}
                placeholder={
                  pollingStations.length > 0 
                    ? "Buscar puesto de votación..." 
                    : selectedMunicipalityId ? "Cargando puestos..." : "Primero selecciona un municipio"
                }
                searchPlaceholder="Buscar por nombre o zona..."
                emptyMessage="No se encontraron puestos de votación"
                disabled={pollingStations.length === 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-voter-table">Mesa *</Label>
              <Select 
                value={editVoterForm.tableNumber} 
                onValueChange={(value) => setEditVoterForm({ ...editVoterForm, tableNumber: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la mesa" />
                </SelectTrigger>
                <SelectContent>
                  {tables.length > 0 ? (
                    tables.map((t: any) => (
                      <SelectItem key={t.number} value={t.number}>{t.number}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      {selectedPollingStationId ? "Cargando mesas..." : "Primero selecciona un puesto"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  backgroundColor: '#2563eb', 
                  color: '#ffffff',
                  fontWeight: 600,
                  border: 'none'
                }}
              >
                <span style={{ color: '#ffffff' }}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Witness Assignment Dialog */}
      <Dialog open={isWitnessDialogOpen} onOpenChange={setIsWitnessDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Designar Testigo Electoral
            </DialogTitle>
            <DialogDescription>
              Asigna a {selectedVoterForWitness?.name} como testigo electoral
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleWitnessSubmit} className="space-y-6">
            {/* Información del Testigo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Información del Testigo
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{selectedVoterForWitness?.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cédula</Label>
                  <p className="font-medium">{selectedVoterForWitness?.document}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{selectedVoterForWitness?.celular || selectedVoterForWitness?.tel || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Municipio</Label>
                  <p className="font-medium text-primary">{selectedVoterForWitness?.municipality || 'No registrado'}</p>
                </div>
              </div>
              {selectedVoterForWitness?.pollingStation && selectedVoterForWitness?.tableNumber && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Información de votación</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Este votante está registrado en <strong>{selectedVoterForWitness.pollingStation}</strong>, Mesa {selectedVoterForWitness.tableNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Asignación de Puesto y Mesas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4" />
                Asignación de Puesto y Mesas
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="witness-polling-station">
                    Puesto de Votación * 
                    <span className="text-xs text-muted-foreground ml-2">
                      (Solo puestos de {selectedVoterForWitness?.municipality})
                    </span>
                  </Label>
                  {useComboboxForPollingStations ? (
                    <Combobox
                      options={witnessPollingStations.map((station: any) => ({
                        value: station.id,
                        label: station.name,
                        subtitle: station.community ? `${station.community}${station.address ? ` - ${station.address}` : ''}` : station.address
                      }))}
                      value={witnessSelectedPollingStationId}
                      onValueChange={setWitnessSelectedPollingStationId}
                      placeholder={
                        witnessPollingStations.length > 0 
                          ? "Buscar puesto de votación..." 
                          : "Cargando puestos..."
                      }
                      searchPlaceholder="Buscar por nombre o zona..."
                      emptyMessage="No se encontraron puestos de votación"
                      disabled={witnessPollingStations.length === 0}
                    />
                  ) : (
                    <Select 
                      value={witnessSelectedPollingStationId} 
                      onValueChange={setWitnessSelectedPollingStationId}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          witnessPollingStations.length > 0 
                            ? "Selecciona el puesto de votación" 
                            : "Cargando puestos..."
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {witnessPollingStations.length > 0 ? (
                          witnessPollingStations.map((station: any) => (
                            <SelectItem key={station.id} value={station.id}>
                              <div className="flex flex-col">
                                <span>{station.name}</span>
                                {station.community && (
                                  <span className="text-xs text-muted-foreground">{station.community}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">
                            {selectedVoterForWitness?.municipality 
                              ? "Cargando puestos de votación..." 
                              : "El votante debe tener municipio asignado"
                            }
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {availableTables.length > 0 && (
                  <div>
                    <Label>Mesas Asignadas * (máximo 5)</Label>
                    <div className="grid grid-cols-8 gap-2 mt-2 p-4 border rounded-lg max-h-40 overflow-y-auto">
                      {availableTables.map((tableNum) => (
                        <Button
                          key={tableNum}
                          type="button"
                          variant={selectedTables.includes(tableNum) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTableToggle(tableNum)}
                          className="h-8 w-8 p-0"
                        >
                          {tableNum}
                        </Button>
                      ))}
                    </div>
                    {selectedTables.length > 0 && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground">Mesas seleccionadas:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedTables.map(table => (
                            <Badge key={table} variant="secondary">Mesa {table}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Información Adicional */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Información Adicional
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="witness-experience">Experiencia</Label>
                  <Select 
                    value={witnessForm.experience} 
                    onValueChange={(value: 'FIRST_TIME' | 'EXPERIENCED') => 
                      setWitnessForm({ ...witnessForm, experience: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST_TIME">Primera vez</SelectItem>
                      <SelectItem value="EXPERIENCED">Experimentado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="witness-availability">Disponibilidad</Label>
                  <Select 
                    value={witnessForm.availability} 
                    onValueChange={(value: 'FULL_DAY' | 'MORNING' | 'AFTERNOON') => 
                      setWitnessForm({ ...witnessForm, availability: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_DAY">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          Todo el día
                        </div>
                      </SelectItem>
                      <SelectItem value="MORNING">Solo mañana</SelectItem>
                      <SelectItem value="AFTERNOON">Solo tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="witness-transport"
                  checked={witnessForm.hasTransport}
                  onCheckedChange={(checked) => 
                    setWitnessForm({ ...witnessForm, hasTransport: !!checked })
                  }
                />
                <Label htmlFor="witness-transport" className="flex items-center gap-2">
                  <Car className="w-3 h-3" />
                  Tiene transporte propio
                </Label>
              </div>

              <div>
                <Label htmlFor="witness-emergency">Contacto de emergencia</Label>
                <Input
                  id="witness-emergency"
                  placeholder="Nombre y teléfono de contacto"
                  value={witnessForm.emergencyContact}
                  onChange={(e) => setWitnessForm({ ...witnessForm, emergencyContact: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="witness-notes">Notas adicionales</Label>
                <Textarea
                  id="witness-notes"
                  placeholder="Instrucciones especiales, observaciones..."
                  value={witnessForm.notes}
                  onChange={(e) => setWitnessForm({ ...witnessForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Validaciones */}
            {!selectedVoterForWitness?.municipalityId && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Municipio requerido</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  El votante debe tener un municipio asignado para poder ser testigo electoral.
                </p>
              </div>
            )}
            
            {selectedVoterForWitness?.municipalityId && witnessPollingStations.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Cargando puestos de votación de {selectedVoterForWitness.municipality}...</span>
                </div>
              </div>
            )}

            {selectedTables.length === 0 && witnessSelectedPollingStationId && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Debe seleccionar al menos una mesa</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsWitnessDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={
                  isSubmitting || 
                  !selectedVoterForWitness?.municipalityId ||
                  selectedTables.length === 0 || 
                  !witnessSelectedPollingStationId
                }
                style={{ 
                  backgroundColor: '#f59e0b', 
                  color: '#ffffff',
                  fontWeight: 600,
                  border: 'none'
                }}
                className="hover:opacity-90"
              >
                <Star className="w-4 h-4 mr-2" style={{ color: '#ffffff' }} />
                <span style={{ color: '#ffffff' }}>
                  {isSubmitting ? 'Asignando...' : 'Asignar Testigo'}
                </span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground">
            © 2025 Gestión Electoral Colombia. Sistema de Organización Política.
          </p>
        </div>
      </footer>
    </div>
  )
}
