'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Key, RefreshCw, Lock, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CandidateWitnessPasswordManagerProps {
  candidateId: string
  witnesses: Array<{
    id: string
    voter: {
      name: string
      document: string
    }
  }>
  onPasswordsUpdated?: () => void
}

export function CandidateWitnessPasswordManager({ 
  candidateId, 
  witnesses,
  onPasswordsUpdated 
}: CandidateWitnessPasswordManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [standardPassword, setStandardPassword] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [passwordStats, setPasswordStats] = useState<{
    total: number
    withPassword: number
    withoutPassword: number
  } | null>(null)

  // Cargar estadísticas de contraseñas
  const loadPasswordStats = async () => {
    try {
      const response = await fetch(`/api/dashboard/candidate/witnesses/passwords?candidateId=${candidateId}`)
      const data = await response.json()
      
      if (data.success) {
        setPasswordStats(data.data)
      }
    } catch (error) {
      console.error('Error loading password stats:', error)
    }
  }

  const handleOpenDialog = () => {
    setIsOpen(true)
    loadPasswordStats()
  }

  const handleResetAllPasswords = async () => {
    if (!standardPassword || standardPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setShowConfirmDialog(true)
  }

  const confirmResetPasswords = async () => {
    setIsLoading(true)
    setShowConfirmDialog(false)

    try {
      const response = await fetch('/api/dashboard/candidate/witnesses/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          action: 'reset-all',
          password: standardPassword
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`✅ Contraseña asignada a ${data.count} testigos`)
        setStandardPassword('')
        loadPasswordStats()
        onPasswordsUpdated?.()
      } else {
        toast.error(data.error || 'Error al asignar contraseñas')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenDialog}
        className="gap-2"
      >
        <Key className="w-4 h-4" />
        Gestionar Contraseñas
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Gestión de Contraseñas de Testigos
            </DialogTitle>
            <DialogDescription>
              Asigna una contraseña estándar para que todos los testigos puedan acceder al sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Estadísticas */}
            {passwordStats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Estado Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{passwordStats.total}</div>
                      <div className="text-xs text-muted-foreground">Total Testigos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {passwordStats.withPassword}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Con Contraseña
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {passwordStats.withoutPassword}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Sin Contraseña
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Asignar Contraseña Estándar */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Contraseña Estándar para Todos los Testigos
                </CardTitle>
                <CardDescription>
                  Esta contraseña se asignará a todos los testigos electorales de tu campaña
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="standard-password">
                    Nueva Contraseña Estándar
                  </Label>
                  <Input
                    id="standard-password"
                    type="text"
                    placeholder="Ej: Testigo2026!"
                    value={standardPassword}
                    onChange={(e) => setStandardPassword(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 6 caracteres. Esta será la contraseña que compartirás con todos los testigos.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <p className="font-medium mb-1">Importante:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Esta acción actualizará la contraseña de TODOS los testigos de tu campaña</li>
                        <li>Los testigos necesitarán esta contraseña para hacer login</li>
                        <li>Guarda esta contraseña en un lugar seguro</li>
                        <li>Compártela solo con los testigos autorizados</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleResetAllPasswords}
                  disabled={isLoading || !standardPassword}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Asignando...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Asignar Contraseña a Todos los Testigos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Información Adicional */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">¿Cómo funciona?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex-shrink-0">1</Badge>
                  <p>Crea una contraseña estándar fácil de recordar</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex-shrink-0">2</Badge>
                  <p>Asigna la contraseña a todos los testigos con un clic</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex-shrink-0">3</Badge>
                  <p>Comparte la contraseña con los líderes antes del día electoral</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex-shrink-0">4</Badge>
                  <p>Los testigos podrán hacer login con su cédula y la contraseña</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              ¿Confirmar Asignación de Contraseñas?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Estás a punto de asignar la contraseña <span className="font-mono font-bold">"{standardPassword}"</span> a todos los testigos electorales de tu campaña.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">Esto significa que:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Todos los testigos ({witnesses.length}) recibirán esta contraseña</li>
                  <li>Podrán hacer login con su cédula y esta contraseña</li>
                  <li>Las contraseñas anteriores serán reemplazadas</li>
                </ul>
              </div>
              <p className="text-sm font-medium">
                ¿Estás seguro de continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPasswords}>
              Sí, Asignar Contraseñas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
