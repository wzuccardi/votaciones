import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const voters = await db.voter.findMany({
      orderBy: { name: 'asc' },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            candidate: {
              select: {
                id: true,
                name: true,
                party: true
              }
            }
          }
        },
        municipality: { select: { id: true, name: true } },
        pollingStation: { select: { id: true, name: true } }
      }
    })

    const data = voters.map(v => ({
      id: v.id,
      document: v.document,
      name: v.name,
      tel: (v as any).tel,
      celular: (v as any).celular,
      email: (v as any).email,
      municipality: v.municipality?.name,
      pollingStation: v.pollingStation?.name,
      tableNumber: v.tableNumber,
      leader: v.leader
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
