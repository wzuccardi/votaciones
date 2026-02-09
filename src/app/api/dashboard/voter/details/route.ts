import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const voterId = searchParams.get('voterId')

    if (!voterId) {
      return NextResponse.json({
        error: 'ID de votante requerido',
        message: 'Se requiere el ID del votante'
      }, { status: 400 })
    }
    const session = await getServerSession(authOptions).catch(() => null)

    const voter = await db.voter.findUnique({
      where: { id: voterId },
      include: {
        leader: {
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
        },
        municipality: {
          select: {
            id: true,
            name: true
          }
        },
        pollingStation: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    })

    if (!voter) {
      return NextResponse.json({
        error: 'Votante no encontrado',
        message: 'El votante no existe'
      }, { status: 404 })
    }
    if (session) {
      const role = (session as any).user?.role
      if (role === 'leader') {
        const sessionLeaderId = (session as any).user?.id
        if (voter.leaderId !== sessionLeaderId) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }
      }
      if (role === 'candidate') {
        const sessionCandidateId = (session as any).user?.candidateId || (session as any).user?.id
        if (voter.leader?.candidate?.id !== sessionCandidateId) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: voter.id,
        document: voter.document,
        name: voter.name,
        tel: (voter as any).tel,
        celular: (voter as any).celular,
        email: (voter as any).email,
        municipality: voter.municipality?.name,
        pollingStation: voter.pollingStation?.name,
        tableNumber: voter.tableNumber,
        leader: voter.leader
      }
    })

  } catch (error) {
    console.error('Error fetching voter details:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los detalles del votante'
    }, { status: 500 })
  }
}
