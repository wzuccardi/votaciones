import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const departments = await db.department.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: departments
    })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los departamentos'
    }, { status: 500 })
  }
}
