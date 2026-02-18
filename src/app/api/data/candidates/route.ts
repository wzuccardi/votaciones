import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const candidates = await db.candidate.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            leaders: true
          }
        }
      }
    })

    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los candidatos'
    }, { status: 500 })
  }
}
