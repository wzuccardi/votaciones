import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Código DANE del departamento de Bolívar
const BOLIVAR_CODE = '13'

export async function GET(req: NextRequest) {
  try {
    // Obtener departamento de Bolívar
    const bolivar = await db.department.findUnique({
      where: { code: BOLIVAR_CODE }
    })

    if (!bolivar) {
      return NextResponse.json({
        error: 'Departamento no encontrado',
        message: 'El departamento de Bolívar no está configurado'
      }, { status: 404 })
    }

    // Retornar solo municipios de Bolívar
    const municipalities = await db.municipality.findMany({
      where: { departmentId: bolivar.id },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: municipalities
    })
  } catch (error) {
    console.error('Error fetching municipalities:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los municipios'
    }, { status: 500 })
  }
}
