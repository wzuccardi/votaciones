'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Landmark, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { signIn, getSession } from 'next-auth/react'

export default function LoginPage() {
  const [role, setRole] = useState<'candidate' | 'leader' | 'witness'>('candidate')
  const [document, setDocument] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const onlyDigits = /^\d+$/
      if (!onlyDigits.test(document)) {
        toast.error('La cédula debe contener solo números')
        setIsLoading(false)
        return
      }
      const result = await signIn('credentials', {
        document,
        password,
        role,
        redirect: false
      })
      if (result && result.ok) {
        toast.success('¡Inicio de sesión exitoso!')
        
        // Si es testigo, redirigir a su página de testigo
        if (role === 'witness') {
          const session = await getSession()
          const uniqueCode = (session as any)?.user?.uniqueCode
          if (uniqueCode) {
            window.location.href = `/testigo/${uniqueCode}`
          } else {
            toast.error('Error: No se encontró código de testigo')
          }
        } else {
          window.location.href = `/dashboard/${role}`
        }
      } else {
        toast.error('Credenciales incorrectas o no tienes permisos')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 via-blue-500/20 to-red-500/20 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/alonso-del-rio.jpg" 
                    alt="Alonso del Río" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.innerHTML = '<svg class="w-6 h-6 text-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
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
          </div>
        </div>
      </header>

      {/* Login Form */}
      <main className="container mx-auto px-4 py-12 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="border-2">
            <CardHeader className="space-y-3 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <img 
                    src="/alonso-del-rio.jpg" 
                    alt="Alonso del Río" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Cámara 103</Badge>
                  </div>
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl">Alonso del Río</CardTitle>
                <CardDescription>
                  Partido Conservador - Es Confianza
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={role} onValueChange={(value: 'candidate' | 'leader' | 'witness') => setRole(value)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="candidate">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Candidato</Badge>
                          <span>Ingresar como Candidato</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="leader">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Líder</Badge>
                          <span>Ingresar como Líder</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="witness">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Testigo</Badge>
                          <span>Ingresar como Testigo Electoral</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Document */}
                <div className="space-y-2">
                  <Label htmlFor="document">Número de Cédula</Label>
                  <Input
                    id="document"
                    type="text"
                    placeholder="Ingresa tu cédula"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>

                {/* Register Link */}
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    ¿No tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => window.location.href = '/'}
                      className="text-primary hover:underline font-medium"
                    >
                      Regístrate aquí
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4">
            <Card className="border-none bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Seguridad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Tu contraseña está encriptada y nunca se guarda en texto plano. 
                  Mantén tus credenciales seguras.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">¿Olvidaste tu contraseña?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Contacta al administrador del sistema para restablecer tu contraseña.
                  No hay opción de recuperación automática por seguridad.
                </p>
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
    </div>
  )
}
