import { z } from 'zod'

// ============================================
// SCHEMAS DE VALIDACIÓN PARA AUTENTICACIÓN
// ============================================

/**
 * Schema para registro de Candidato
 */
export const candidateRegisterSchema = z.object({
    document: z
        .string()
        .min(1, 'La cédula es requerida')
        .regex(/^\d+$/, 'La cédula debe contener solo números')
        .min(6, 'La cédula debe tener al menos 6 dígitos')
        .max(15, 'La cédula no puede tener más de 15 dígitos'),

    name: z
        .string()
        .min(1, 'El nombre es requerido')
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),

    party: z
        .string()
        .min(1, 'El partido político es requerido')
        .min(3, 'El nombre del partido debe tener al menos 3 caracteres')
        .max(100, 'El nombre del partido no puede exceder 100 caracteres'),

    password: z
        .string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .max(50, 'La contraseña no puede exceder 50 caracteres'),

    confirmPassword: z
        .string()
        .min(1, 'Confirma tu contraseña')
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
})

export type CandidateRegisterInput = z.infer<typeof candidateRegisterSchema>

/**
 * Schema para registro de Líder
 */
export const leaderRegisterSchema = z.object({
    document: z
        .string()
        .min(1, 'La cédula es requerida')
        .regex(/^\d+$/, 'La cédula debe contener solo números')
        .min(6, 'La cédula debe tener al menos 6 dígitos')
        .max(15, 'La cédula no puede tener más de 15 dígitos'),

    name: z
        .string()
        .min(1, 'El nombre es requerido')
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),

    candidateId: z
        .string()
        .min(1, 'Debes seleccionar un candidato'),

    password: z
        .string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .max(50, 'La contraseña no puede exceder 50 caracteres'),

    confirmPassword: z
        .string()
        .min(1, 'Confirma tu contraseña')
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
})

export type LeaderRegisterInput = z.infer<typeof leaderRegisterSchema>

/**
 * Schema para registro de Votante
 */
export const voterRegisterSchema = z.object({
    document: z
        .string()
        .min(1, 'La cédula es requerida')
        .regex(/^\d+$/, 'La cédula debe contener solo números')
        .min(6, 'La cédula debe tener al menos 6 dígitos')
        .max(15, 'La cédula no puede tener más de 15 dígitos'),

    name: z
        .string()
        .min(1, 'El nombre es requerido')
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),

    tel: z
        .string()
        .regex(/^\d*$/, 'El teléfono debe contener solo números')
        .optional()
        .or(z.literal('')),

    celular: z
        .string()
        .regex(/^\d*$/, 'El celular debe contener solo números')
        .optional()
        .or(z.literal('')),

    email: z
        .string()
        .email('Correo electrónico inválido')
        .optional()
        .or(z.literal('')),

    leaderId: z
        .string()
        .optional()
        .or(z.literal('')),

    municipality: z
        .string()
        .min(1, 'Debes seleccionar un municipio'),

    pollingStation: z
        .string()
        .min(1, 'Debes seleccionar un puesto de votación'),

    tableNumber: z
        .string()
        .regex(/^\d*$/, 'El número de mesa debe ser numérico')
        .optional()
        .or(z.literal('')),
})

export type VoterRegisterInput = z.infer<typeof voterRegisterSchema>

/**
 * Schema para login
 */
export const loginSchema = z.object({
    document: z
        .string()
        .min(1, 'La cédula es requerida')
        .regex(/^\d+$/, 'La cédula debe contener solo números'),

    password: z
        .string()
        .min(1, 'La contraseña es requerida'),

    role: z.enum(['candidate', 'leader', 'witness'], {
        message: 'Selecciona un rol válido'
    })
})

export type LoginInput = z.infer<typeof loginSchema>
