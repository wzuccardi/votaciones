import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/password'

const prisma = new PrismaClient()

// POST - Asignar contraseña a todos los testigos del candidato
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { candidateId, password, action } = body

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'candidateId es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el candidato existe
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    })

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidato no encontrado' },
        { status: 404 }
      )
    }

    // Acción: Resetear todas las contraseñas de todos los testigos del candidato
    if (action === 'reset-all') {
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Contraseña es requerida' },
          { status: 400 }
        )
      }

      const hashedPassword = await hashPassword(password)

      // Obtener todos los testigos de todos los líderes del candidato
      const witnesses = await prisma.electoralWitness.findMany({
        where: {
          leader: {
            candidateId
          }
        },
        include: { voter: true }
      })

      // Actualizar contraseña de todos los votantes que son testigos
      const voterIds = witnesses.map(w => w.voterId)
      
      await prisma.voter.updateMany({
        where: {
          id: { in: voterIds }
        },
        data: {
          password: hashedPassword
        }
      })

      return NextResponse.json({
        success: true,
        message: `Contraseña actualizada para ${witnesses.length} testigos`,
        count: witnesses.length
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error managing witness passwords:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Verificar si los testigos tienen contraseña
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'candidateId es requerido' },
        { status: 400 }
      )
    }

    // Obtener todos los testigos de todos los líderes del candidato
    const witnesses = await prisma.electoralWitness.findMany({
      where: {
        leader: {
          candidateId
        }
      },
      include: {
        voter: {
          select: {
            id: true,
            name: true,
            document: true,
            password: true
          }
        }
      }
    })

    const witnessesStatus = witnesses.map(w => ({
      id: w.id,
      name: w.voter.name,
      document: w.voter.document,
      hasPassword: !!w.voter.password
    }))

    const totalWithPassword = witnessesStatus.filter(w => w.hasPassword).length

    return NextResponse.json({
      success: true,
      data: {
        total: witnesses.length,
        withPassword: totalWithPassword,
        withoutPassword: witnesses.length - totalWithPassword,
        witnesses: witnessesStatus
      }
    })

  } catch (error) {
    console.error('Error checking witness passwords:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
