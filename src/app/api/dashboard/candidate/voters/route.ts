import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let candidateId = searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json({
        error: 'ID de candidato requerido',
        message: 'Se requiere el ID del candidato'
      }, { status: 400 })
    }
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const role = (session as any).user?.role
    const sessionCandidateId = (session as any).user?.candidateId || (session as any).user?.id
    if (role === 'candidate' && sessionCandidateId !== candidateId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (role === 'leader') {
      const leader = await db.leader.findUnique({
        where: { id: (session as any).user?.id },
        select: { candidateId: true }
      })
      if (!leader || leader.candidateId !== candidateId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const voters = await db.voter.findMany({
      where: {
        leader: {
          candidateId
        }
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true
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
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform data to match frontend expectations
    const transformedVoters = voters.map(voter => ({
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
    }))

    return NextResponse.json({
      success: true,
      data: transformedVoters
    })

  } catch (error) {
    console.error('Error fetching voters:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los votantes'
    }, { status: 500 })
  }
}
