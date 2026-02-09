'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, UserCheck, UserCircle2 } from 'lucide-react'
import { getSession } from 'next-auth/react'

// Nuevos componentes de landing
import { CandidateBanner } from '@/components/landing/CandidateBanner'
import { StatsPanel } from '@/components/landing/StatsPanel'
import { RoleCard } from '@/components/landing/RoleCard'
import { RegisterDialog } from '@/components/landing/RegisterDialog'

// Nuevos componentes de formularios
import { CandidateRegisterForm } from '@/components/forms/CandidateRegisterForm'
import { LeaderRegisterForm } from '@/components/forms/LeaderRegisterForm'
import { VoterRegisterForm } from '@/components/forms/VoterRegisterForm'

// React Query hooks
import { useCandidates } from '@/hooks/queries/useCandidates'
import { useLeaders } from '@/hooks/queries/useLeaders'
import { useMunicipalities } from '@/hooks/queries/useMunicipalities'
import { usePollingStations } from '@/hooks/queries/usePollingStations'

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'leader' | 'voter' | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Usar React Query para cargar datos
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates()
  const { data: leaders = [], isLoading: leadersLoading } = useLeaders()
  const { data: municipalities = [], isLoading: municipalitiesLoading } = useMunicipalities()
  const { data: pollingStations = [], isLoading: pollingStationsLoading } = usePollingStations(null) // null = todos los puestos

  const isDataLoading = candidatesLoading || leadersLoading || municipalitiesLoading || pollingStationsLoading

  const handleGoToDashboard = () => {
    getSession().then((session) => {
      const role = (session as any)?.user?.role
      if (role) {
        window.location.href = `/dashboard/${role}`
      } else {
        window.location.href = '/login'
      }
    })
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedRole(null)
  }

  // Features por rol
  const candidateFeatures = [
    { text: 'Dashboard con métricas detalladas' },
    { text: 'Gráficas de crecimiento por zona' },
    { text: 'Buscador avanzado de votantes' },
    { text: 'Análisis geográfico electoral' }
  ]

  const leaderFeatures = [
    { text: 'Registro de votantes' },
    { text: 'Asignación a puestos de votación' },
    { text: 'Gestión de información de contacto' },
    { text: 'Reportes de tu red' }
  ]

  const voterFeatures = [
    { text: 'Registro autónomo' },
    { text: 'Selección de líder' },
    { text: 'Información de ubicación electoral' },
    { text: 'Actualización de datos' }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/30">
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
                      e.currentTarget.parentElement!.innerHTML = '<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 via-blue-500/20 to-red-500/20 flex items-center justify-center"><svg class="w-6 h-6 text-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>'
                    }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded">
                  103
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold">Alonso del Río - Cámara 103</h1>
                <p className="text-xs text-muted-foreground">Partido Conservador - Es Confianza</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/login'}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Candidate Banner */}
          <CandidateBanner />

          {/* Stats Panel */}
          <StatsPanel
            stats={[
              { value: municipalities.length, label: 'Municipios (Bolívar)' },
              { value: pollingStations.length, label: 'Puestos de Votación' },
              { value: candidates.length, label: 'Candidatos' },
              { value: leaders.length, label: 'Líderes' }
            ]}
          />

          {/* Main Title */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Organiza tu Campaña Electoral
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              Plataforma completa de gestión política para elecciones Cámara y Senado. Coordina líderes, votantes y analiza la georreferenciación de tu base electoral en tiempo real.
            </p>

            {/* CTA Buttons */}
            {isDataLoading ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span>Cargando datos electorales...</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  <span>{pollingStations.length} puestos de votación en Bolívar con georreferenciación</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className="container mx-auto px-4 py-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Candidate Card */}
          <RoleCard
            icon={UserCircle2}
            title="Candidato"
            description="Visualiza y gestiona tu red completa de líderes y votantes con estadísticas en tiempo real. Sistema optimizado para las elecciones Cámara y Senado 2026."
            badge="Administrador"
            features={candidateFeatures}
            onClick={() => {
              if (isDialogOpen) return
              setSelectedRole('candidate')
              setIsDialogOpen(true)
            }}
          >
            <RegisterDialog
              open={isDialogOpen && selectedRole === 'candidate'}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) setSelectedRole(null)
              }}
              title="Registrar Candidato"
              description="Ingresa los datos del candidato para comenzar la campaña"
            >
              <CandidateRegisterForm onSuccess={handleDialogClose} />
            </RegisterDialog>
          </RoleCard>

          {/* Leader Card */}
          <RoleCard
            icon={Users}
            title="Líder"
            description="Gestiona tu red de votantes con datos geográficos detallados de los puestos de votación Cámara y Senado 2026."
            badge="Organizador"
            features={leaderFeatures}
            onClick={() => {
              if (isDialogOpen) return
              setSelectedRole('leader')
              setIsDialogOpen(true)
            }}
          >
            <RegisterDialog
              open={isDialogOpen && selectedRole === 'leader'}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) setSelectedRole(null)
              }}
              title="Registrar Líder"
              description="Ingresa los datos del líder. Debes estar vinculado a un candidato existente."
            >
              <LeaderRegisterForm
                candidates={candidates}
                onSuccess={handleDialogClose}
              />
            </RegisterDialog>
          </RoleCard>

          {/* Voter Card */}
          <RoleCard
            icon={UserCheck}
            title="Votante"
            description="Regístrate en la plataforma para las elecciones Cámara y Senado 2026. Obtén información de tu puesto de votación con georreferenciación completa."
            badge="Participante"
            features={voterFeatures}
            onClick={() => {
              if (isDialogOpen) return
              setSelectedRole('voter')
              setIsDialogOpen(true)
            }}
          >
            <RegisterDialog
              open={isDialogOpen && selectedRole === 'voter'}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) setSelectedRole(null)
              }}
              title="Registrar Votante"
              description="Ingresa tus datos personales y de ubicación electoral"
            >
              <VoterRegisterForm
                leaders={leaders}
                municipalities={municipalities}
                onSuccess={handleDialogClose}
              />
            </RegisterDialog>
          </RoleCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>AppVotaciones - Sistema de Gestión Electoral © 2026</p>
        </div>
      </footer>
    </div>
  )
}
