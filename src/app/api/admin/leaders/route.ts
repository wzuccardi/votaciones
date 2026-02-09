import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const leaders = await db.leader.findMany({
      orderBy: { name: 'asc' },
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
        },
        _count: { select: { voters: true } }
      }
    })

    return NextResponse.json({ success: true, data: leaders })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
