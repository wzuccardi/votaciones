'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  UserCheck,
  MapPin,
  LogOut,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

export default function VoterDashboard() {
  const searchParams = useSearchParams()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [voterDetails, setVoterDetails] = useState<any>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (isRedirecting) return
    const voterId = searchParams.get('voterId')
    if (voterId) {
      fetchVoterDetails(voterId)
    }
  }, [searchParams, isRedirecting])

  const fetchVoterDetails = async (voterId: string) => {
    try {
      const response = await fetch(`/api/dashboard/voter/details?voterId=${voterId}`)
      if (response.ok) {
        const data = await response.json()
        setVoterDetails(data.data)
        setCurrentUser({ name: data.data?.name, document: data.data?.document })
      }
    } catch (error) {
      console.error('Error fetching voter details:', error)
    }
  }

  useEffect(() => {
    const c = voterDetails?.leader?.candidate
    if (c && (c.primaryColor || c.secondaryColor)) {
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
  }, [voterDetails])

  useEffect(() => {
    const candidateId = voterDetails?.leader?.candidate?.id
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
  }, [voterDetails?.leader?.candidate?.id])
  const handleLogout = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Dashboard de Votante</h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenido, {currentUser?.name}
                </p>
              </div>
            <div className="flex items-center gap-3">
              {voterDetails?.leader?.candidate?.logoUrl && (
                <img src={voterDetails.leader.candidate.logoUrl} alt="Logo" className="w-8 h-8 rounded" />
              )}
              <Badge variant="outline" className="hidden md:flex">
                <UserCheck className="w-3 h-3 mr-1" />
                Votante
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1 max-w-3xl">
        {/* Voter Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Tus datos de registro en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nombre Completo</p>
                <p className="font-medium text-lg">{currentUser?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Número de Cédula</p>
                <p className="font-medium text-lg">{currentUser?.document}</p>
              </div>
            </div>

            {voterDetails?.leader && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Líder Asignado</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <p className="font-medium">{voterDetails.leader.name}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Voting Location Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ubicación de Votación
            </CardTitle>
            <CardDescription>
              Información oficial de tu puesto y mesa de votación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {voterDetails?.municipality || voterDetails?.pollingStation ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {voterDetails?.municipality && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Municipio</p>
                      <p className="font-medium text-lg">{voterDetails.municipality}</p>
                    </div>
                  )}
                  {voterDetails?.pollingStation && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Puesto de Votación</p>
                      <p className="font-medium text-lg">{voterDetails.pollingStation}</p>
                    </div>
                  )}
                </div>

                {voterDetails?.tableNumber && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Número de Mesa</p>
                      <p className="font-medium text-lg">Mesa {voterDetails.tableNumber}</p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  No tienes información de ubicación de votación registrada
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

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
