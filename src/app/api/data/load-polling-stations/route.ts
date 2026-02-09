import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session as any).user?.role !== 'candidate') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    const body = await req.json().catch(() => ({}))
    const providedPath: string | undefined = body?.filePath

    const candidatePaths = [
      join(process.cwd(), 'Genio', 'Divipole_Elecciones_Territoriales_2023_con_georreferenciación_20260119 (1).csv'),
      join(process.cwd(), 'upload', 'Divipole_Elecciones_Territoriales_2023_con_georreferenciación_20260119.csv')
    ]

    const resolvedPath = providedPath && existsSync(providedPath)
      ? providedPath
      : candidatePaths.find(p => existsSync(p))

    if (!resolvedPath) {
      return NextResponse.json({
        error: 'Archivo no encontrado',
        message: 'No se pudo localizar el CSV. Proporcione filePath en el cuerpo o coloque el archivo en upload/ o Genio/.',
        triedPaths: [providedPath, ...candidatePaths].filter(Boolean)
      }, { status: 400 })
    }

    const csvContent = readFileSync(resolvedPath, 'utf-8')
    const lines = csvContent.split('\n').slice(1) // Skip header

    let processed = 0
    let errors = 0
    const results: any[] = []

    for (const line of lines) {
      if (!line.trim()) continue

      // Parse CSV line (simple CSV parsing)
      const parts = line.split('","').map(part => part.replace(/^"|"$/g, '').trim())

      const [
        departamento,
        municipio,
        puesto,
        comuna,
        direccion,
        latitud,
        longitud,
        alcaldia,
        gobernacion,
        concejo,
        asamblea,
        jal,
        cantidad
      ] = parts

      if (!departamento || !municipio || !puesto) {
        errors++
        continue
      }

      // Find or create department
      let department = await db.department.findFirst({
        where: { name: departamento }
      })

      if (!department) {
        department = await db.department.create({
          data: {
            name: departamento,
            code: `DEPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        })
      }

      // Find or create municipality
      let municipality = await db.municipality.findFirst({
        where: {
          name: municipio,
          departmentId: department.id
        }
      })

      if (!municipality) {
        municipality = await db.municipality.create({
          data: {
            name: municipio,
            code: `MUN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            departmentId: department.id
          }
        })
      }

      // Check if polling station already exists
      const existingStation = await db.pollingStation.findFirst({
        where: {
          name: puesto,
          municipalityId: municipality.id
        }
      })

      if (!existingStation) {
        // Create polling station
        const pollingStation = await db.pollingStation.create({
          data: {
            name: puesto,
            code: `PST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            address: direccion || null,
            community: comuna || null,
            latitude: latitud ? parseFloat(latitud) : null,
            longitude: longitud ? parseFloat(longitud) : null,
            municipalityId: municipality.id
          }
        })

        results.push({
          departamento,
          municipio,
          puesto,
          address: direccion,
          latitude: latitud,
          longitude: longitud
        })
        processed++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Datos de puestos de votación cargados exitosamente',
      data: {
        processed,
        errors,
        total: lines.length,
        filePath: resolvedPath
      }
    })

  } catch (error) {
    console.error('Error loading polling stations:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: error instanceof Error ? error.message : 'Ocurrió un error al procesar el archivo'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const pollingStations = await db.pollingStation.findMany({
      include: {
        municipality: {
          include: {
            department: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: 100 // Return first 100 for preview
    })

    return NextResponse.json({
      success: true,
      data: pollingStations,
      total: await db.pollingStation.count()
    })
  } catch (error) {
    console.error('Error fetching polling stations:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los puestos de votación'
    }, { status: 500 })
  }
}
