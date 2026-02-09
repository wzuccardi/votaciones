'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Users, UserCheck, Landmark, Search, LogOut, Phone, Smartphone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useSession, signOut } from 'next-auth/react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [candidates, setCandidates] = useState<any[]>([])
  const [leaders, setLeaders] = useState<any[]>([])
  const [voters, setVoters] = useState<any[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (isRedirecting) return
    if (status === 'authenticated' && session?.user) {
      setCurrentUser(session.user)
      fetchAdminData()
    } else if (status === 'unauthenticated') {
      setIsRedirecting(true)
      window.location.href = '/login'
    }
  }, [status, session, isRedirecting])

  const fetchAdminData = async () => {
    try {
      const [cRes, lRes, vRes] = await Promise.all([
        fetch('/api/admin/candidates'),
        fetch('/api/admin/leaders'),
        fetch('/api/admin/voters')
      ])
      if (cRes.ok) {
        const cd = await cRes.json()
        setCandidates(cd.data || [])
      }
      if (lRes.ok) {
        const ld = await lRes.json()
        setLeaders(ld.data || [])
      }
      if (vRes.ok) {
        const vd = await vRes.json()
        setVoters(vd.data || [])
      }
    } catch (e) {
      toast.error('Error al cargar datos de administración')
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  const filtered = (arr: any[]) => {
    const q = query.toLowerCase()
    return arr.filter(x => {
      return (
        (x.name && x.name.toLowerCase().includes(q)) ||
        (x.document && x.document.toLowerCase().includes(q)) ||
        (x.party && x.party.toLowerCase().includes(q))
      )
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Módulo de Administración</h1>
              <p className="text-sm text-muted-foreground">{currentUser?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden md:flex">
                <Landmark className="w-3 h-3 mr-1" />
                Administrador
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Buscar
            </CardTitle>
            <CardDescription>Filtra por nombre, cédula o partido</CardDescription>
          </CardHeader>
          <CardContent>
            <Input placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Landmark className="w-5 h-5" /> Candidatos</span>
                <Badge variant="secondary">{candidates.length}</Badge>
              </CardTitle>
              <CardDescription>Lista de candidatos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-4">
                <div className="space-y-3">
                  {filtered(candidates).map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">CC: {c.document}</p>
                          <p className="text-xs text-muted-foreground mt-1">{c.party}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs"><Users className="w-3 h-3 mr-1" /> {c._count?.leaders || 0} líderes</Badge>
                          <Badge variant="outline" className="text-xs"><UserCheck className="w-3 h-3 mr-1" /> {c.votersCount || 0} votantes</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Users className="w-5 h-5" /> Líderes</span>
                <Badge variant="secondary">{leaders.length}</Badge>
              </CardTitle>
              <CardDescription>Lista de líderes por campaña</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-4">
                <div className="space-y-3">
                  {filtered(leaders).map((l) => (
                    <div key={l.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{l.name}</p>
                          <p className="text-xs text-muted-foreground">CC: {l.document}</p>
                          {l.candidate && (
                            <p className="text-xs text-muted-foreground mt-1">{l.candidate.name} ({l.candidate.party})</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">{l._count?.voters || 0} votantes</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><UserCheck className="w-5 h-5" /> Votantes</span>
                <Badge variant="secondary">{voters.length}</Badge>
              </CardTitle>
              <CardDescription>Listado general de votantes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-4">
                <div className="space-y-3">
                  {filtered(voters).map((v) => (
                    <div key={v.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{v.name}</p>
                          <p className="text-xs text-muted-foreground">CC: {v.document}</p>
                          {(v.tel || v.celular || v.email) && (
                            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                              {v.tel && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {v.tel}
                                </span>
                              )}
                              {v.celular && (
                                <span className="flex items-center gap-1">
                                  <Smartphone className="w-3 h-3" />
                                  {v.celular}
                                </span>
                              )}
                              {v.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {v.email}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {v.municipality && <span>Municipio: {v.municipality} </span>}
                            {v.pollingStation && <span>- Puesto: {v.pollingStation} </span>}
                            {v.tableNumber && <span>- Mesa: {v.tableNumber}</span>}
                          </div>
                          {v.leader && (
                            <p className="text-xs text-muted-foreground mt-1">Líder: {v.leader.name} {v.leader.candidate ? `- ${v.leader.candidate.name}` : ''}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground">© 2025 Gestión Electoral Colombia. Sistema de Organización Política.</p>
        </div>
      </footer>
    </div>
  )
}
