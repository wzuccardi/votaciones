'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { candidateRegisterSchema, type CandidateRegisterInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

interface CandidateRegisterFormProps {
    onSuccess?: () => void
}

export function CandidateRegisterForm({ onSuccess }: CandidateRegisterFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CandidateRegisterInput>({
        resolver: zodResolver(candidateRegisterSchema),
    })

    const onSubmit = async (data: CandidateRegisterInput) => {
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    document: data.document,
                    name: data.name,
                    party: data.party,
                    password: data.password,
                    role: 'candidate'
                })
            })

            const result = await response.json()

            if (response.ok) {
                toast.success('¡Candidato registrado exitosamente!')
                reset()
                onSuccess?.()

                // Auto-login después del registro
                await signIn('credentials', {
                    document: data.document,
                    password: data.password,
                    role: 'candidate',
                    redirect: false
                })
                window.location.href = '/dashboard/candidate'
            } else {
                if (result.alreadyLinked) {
                    toast.error(result.message || 'Documento ya vinculado a otra campaña')
                } else {
                    toast.error(result.error || 'Error al registrar candidato')
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
                <Label htmlFor="candidate-document">Número de Cédula *</Label>
                <Input
                    id="candidate-document"
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
                <Label htmlFor="candidate-name">Nombre Completo *</Label>
                <Input
                    id="candidate-name"
                    type="text"
                    placeholder="Ej: Juan Pérez García"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="candidate-party">Partido Político *</Label>
                <Input
                    id="candidate-party"
                    type="text"
                    placeholder="Ej: Partido Liberal"
                    {...register('party')}
                    aria-invalid={!!errors.party}
                />
                {errors.party && (
                    <p className="text-sm text-destructive">{errors.party.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="candidate-password">Contraseña *</Label>
                <Input
                    id="candidate-password"
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
                <Label htmlFor="candidate-confirm-password">Confirmar Contraseña *</Label>
                <Input
                    id="candidate-confirm-password"
                    type="password"
                    placeholder="Repite tu contraseña"
                    {...register('confirmPassword')}
                    aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrar Candidato'}
            </Button>
        </form>
    )
}
