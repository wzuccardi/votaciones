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

    const leaders = await db.leader.findMany({
      where: { candidateId },
      include: {
        _count: {
          select: {
            voters: true,
            subLeaders: true
          }
        },
        parentLeader: {
          select: {
            id: true,
            name: true,
            document: true
          }
        }
      },
      orderBy: [
        { parentLeaderId: 'asc' }, // Primero líderes principales (null), luego sublíderes
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: leaders
    })

  } catch (error) {
    console.error('Error fetching leaders:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los líderes'
    }, { status: 500 })
  }
}
