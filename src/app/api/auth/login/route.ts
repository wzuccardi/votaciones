import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { verifyPassword } from '@/lib/password'

// Verificación de contraseña con PBKDF2

const loginSchema = z.object({
  document: z.string().min(1, 'La cédula es requerida'),
  password: z.string().min(1, 'La contraseña es requerida'),
  role: z.enum(['candidate', 'leader']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { document, password, role } = loginSchema.parse(body)

    const inputPassword = password

    if (role === 'candidate') {
      const candidate = await db.candidate.findUnique({
        where: { document },
        select: {
          id: true,
          document: true,
          name: true,
          party: true,
          primaryColor: true,
          secondaryColor: true,
          logoUrl: true,
          photoUrl: true,
          password: true
        }
      })

      if (!candidate || !verifyPassword(inputPassword, candidate.password)) {
        return NextResponse.json({
          error: 'Credenciales inválidas',
          message: 'La cédula o contraseña son incorrectas'
        }, { status: 401 })
      }

      return NextResponse.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          id: candidate.id,
          document: candidate.document,
          name: candidate.name,
          party: candidate.party,
          primaryColor: candidate.primaryColor,
          secondaryColor: candidate.secondaryColor,
          logoUrl: candidate.logoUrl,
          photoUrl: candidate.photoUrl,
          role
        }
      })
    }

    if (role === 'leader') {
      const leader = await db.leader.findUnique({
        where: { document },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              party: true,
              primaryColor: true,
              secondaryColor: true,
              logoUrl: true,
              photoUrl: true
            }
          }
        }
      })

      if (!leader || !verifyPassword(inputPassword, (leader as any).password)) {
        return NextResponse.json({
          error: 'Credenciales inválidas',
          message: 'La cédula o contraseña son incorrectas'
        }, { status: 401 })
      }

      return NextResponse.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          id: (leader as any).id,
          document: (leader as any).document,
          name: (leader as any).name,
          candidateId: (leader as any).candidateId,
          candidate: (leader as any).candidate,
          role
        }
      })
    }

    return NextResponse.json({
      error: 'Rol inválido',
      message: 'El rol especificado no es válido'
    }, { status: 400 })

  } catch (error) {
    console.error('Login error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Error de validación',
        message: error.issues[0]?.message || 'Datos inválidos',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al procesar la solicitud'
    }, { status: 500 })
  }
}
