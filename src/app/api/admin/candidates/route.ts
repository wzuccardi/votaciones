import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const candidates = await db.candidate.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        party: true,
        document: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
        photoUrl: true,
        _count: { select: { leaders: true } }
      }
    })

    const enhanced = await Promise.all(candidates.map(async (c) => {
      const votersCount = await db.voter.count({
        where: { leader: { candidateId: c.id } }
      })
      return { ...c, votersCount }
    }))

    return NextResponse.json({ success: true, data: enhanced })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
