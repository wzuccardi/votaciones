import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const departmentId = searchParams.get('departmentId')

    // Si se proporciona departmentId, filtrar por ese departamento
    // Si no, retornar todos los municipios
    const where = departmentId ? { departmentId } : {}

    const municipalities = await db.municipality.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        department: {
          select: {
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            pollingStations: true
          }
        }
      }
    })

    return NextResponse.json(municipalities)
  } catch (error) {
    console.error('Error fetching municipalities:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los municipios'
    }, { status: 500 })
  }
}
