'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leaderRegisterSchema, type LeaderRegisterInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

interface LeaderRegisterFormProps {
    candidates: Array<{ id: string; name: string; party: string }>
    onSuccess?: () => void
}

export function LeaderRegisterForm({ candidates, onSuccess }: LeaderRegisterFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<LeaderRegisterInput>({
        resolver: zodResolver(leaderRegisterSchema),
    })

    const candidateId = watch('candidateId')

    const onSubmit = async (data: LeaderRegisterInput) => {
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    document: data.document,
                    name: data.name,
                    candidateId: data.candidateId,
                    password: data.password,
                    role: 'leader'
                })
            })

            const result = await response.json()

            if (response.ok) {
                toast.success('¡Líder registrado exitosamente!')
                reset()
                onSuccess?.()

                // Auto-login después del registro
                await signIn('credentials', {
                    document: data.document,
                    password: data.password,
                    role: 'leader',
                    redirect: false
                })
                window.location.href = '/dashboard/leader'
            } else {
                if (result.alreadyLinked) {
                    toast.error(result.message || 'Documento ya vinculado a otra campaña')
                } else {
                    toast.error(result.error || 'Error al registrar líder')
                }
            }
        } catch (error) {
            toast.error('Error de conexión. Verifica tu internet.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="leader-document">Número de Cédula *</Label>
                <Input
                    id="leader-document"
                    type="text"
                    placeholder="Ej: 1234567890"
                    {...register('document')}
                    aria-invalid={!!errors.document}
                />
                {errors.document && (
                    <p className="text-sm text-destructive">{errors.document.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="leader-name">Nombre Completo *</Label>
                <Input
                    id="leader-name"
                    type="text"
                    placeholder="Ej: María López Martínez"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="leader-candidate">Candidato al que pertenece *</Label>
                <Select
                    value={candidateId}
                    onValueChange={(value) => setValue('candidateId', value, { shouldValidate: true })}
                >
                    <SelectTrigger id="leader-candidate" aria-invalid={!!errors.candidateId}>
                        <SelectValue placeholder="Selecciona un candidato" />
                    </SelectTrigger>
                    <SelectContent>
                        {candidates.length > 0 ? (
                            candidates.map((candidate) => (
                                <SelectItem key={candidate.id} value={candidate.id}>
                                    {candidate.name} ({candidate.party})
                                </SelectItem>
                            ))
                        ) : (
                            <div className="p-2 text-sm text-muted-foreground">No hay candidatos registrados</div>
                        )}
                    </SelectContent>
                </Select>
                {errors.candidateId && (
                    <p className="text-sm text-destructive">{errors.candidateId.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="leader-password">Contraseña *</Label>
                <Input
                    id="leader-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    {...register('password')}
                    aria-invalid={!!errors.password}
                />
                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="leader-confirm-password">Confirmar Contraseña *</Label>
                <Input
                    id="leader-confirm-password"
                    type="password"
                    placeholder="Repite tu contraseña"
                    {...register('confirmPassword')}
                    aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || candidates.length === 0}>
                {isLoading ? 'Registrando...' : 'Registrar Líder'}
            </Button>
        </form>
    )
}
