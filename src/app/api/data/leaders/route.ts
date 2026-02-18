import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const candidateId = searchParams.get('candidateId')

    const where = candidateId ? { candidateId } : {}

    const leaders = await db.leader.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            party: true
          }
        },
        _count: {
          select: {
            voters: true,
            subLeaders: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(leaders)
  } catch (error) {
    console.error('Error fetching leaders:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los líderes'
    }, { status: 500 })
  }
}
