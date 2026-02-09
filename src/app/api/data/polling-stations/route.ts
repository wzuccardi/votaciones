import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const municipalityId = searchParams.get('municipalityId')

    const where = municipalityId ? { municipalityId } : {}

    const pollingStations = await db.pollingStation.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: pollingStations
    })
  } catch (error) {
    console.error('Error fetching polling stations:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los puestos de votación'
    }, { status: 500 })
  }
}
