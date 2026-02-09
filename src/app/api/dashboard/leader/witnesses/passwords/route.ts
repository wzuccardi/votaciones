import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/password'

const prisma = new PrismaClient()

// POST - Asignar contraseña a un testigo o resetear todas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leaderId, witnessId, password, action } = body

    if (!leaderId) {
      return NextResponse.json(
        { success: false, error: 'leaderId es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el líder existe
    const leader = await prisma.leader.findUnique({
      where: { id: leaderId }
    })

    if (!leader) {
      return NextResponse.json(
        { success: false, error: 'Líder no encontrado' },
        { status: 404 }
      )
    }

    // Acción: Resetear todas las contraseñas
    if (action === 'reset-all') {
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Contraseña es requerida' },
          { status: 400 }
        )
      }

      const hashedPassword = await hashPassword(password)

      // Obtener todos los testigos del líder
      const witnesses = await prisma.electoralWitness.findMany({
        where: { leaderId },
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

    // Acción: Asignar/cambiar contraseña individual
    if (witnessId && password) {
      const witness = await prisma.electoralWitness.findUnique({
        where: { id: witnessId },
        include: { voter: true }
      })

      if (!witness) {
        return NextResponse.json(
          { success: false, error: 'Testigo no encontrado' },
          { status: 404 }
        )
      }

      if (witness.leaderId !== leaderId) {
        return NextResponse.json(
          { success: false, error: 'No tienes permisos para modificar este testigo' },
          { status: 403 }
        )
      }

      const hashedPassword = await hashPassword(password)

      await prisma.voter.update({
        where: { id: witness.voterId },
        data: { password: hashedPassword }
      })

      return NextResponse.json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
        witness: {
          id: witness.id,
          name: witness.voter.name,
          document: witness.voter.document
        }
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
    const leaderId = searchParams.get('leaderId')

    if (!leaderId) {
      return NextResponse.json(
        { success: false, error: 'leaderId es requerido' },
        { status: 400 }
      )
    }

    const witnesses = await prisma.electoralWitness.findMany({
      where: { leaderId },
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
