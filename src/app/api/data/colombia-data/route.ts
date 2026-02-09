import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

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
      join(process.cwd(), 'upload', 'Divipole_Elecciones_Territoriales_2023_con_georreferenciación_20260119 (1).csv'),
      join(process.cwd(), 'upload', 'Divipole_Elecciones_Territoriales_2023_con_georreferenciación_20260119.csv')
    ]
    const csvPath = (providedPath && existsSync(providedPath)) ? providedPath : candidatePaths.find(p => existsSync(p))
    if (!csvPath) {
      return NextResponse.json({
        error: 'Archivo CSV no encontrado',
        message: 'No se encontró el archivo de datos en Genio/ o upload/',
        triedPaths: [providedPath, ...candidatePaths].filter(Boolean)
      }, { status: 404 })
    }
    const csvContent = readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').slice(1) // Skip header

    // Clear existing data
    await db.pollingStation.deleteMany({})
    await db.municipality.deleteMany({})
    await db.department.deleteMany({})

    let processed = 0
    let errors = 0
    const results: any[] = []

    const departments = new Map<string, any>()
    const municipalities = new Map<string, any>()

    for (const line of lines) {
      if (!line.trim()) continue

      // Parse CSV line (simple CSV parsing)
      const delimiter = '","'
      const parts = line.split(delimiter).map((part: string) => part.replace(/^"|"$/g, '').trim())

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

      // Create or get department
      let dept
      if (departments.has(departamento)) {
        dept = departments.get(departamento)
      } else {
        dept = await db.department.create({
          data: {
            name: departamento,
            code: `DEPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        })
        departments.set(departamento, dept)
        results.push({ type: 'department', name: departamento })
      }

      // Create or get municipality
      let municipality
      const municipalityKey = `${departamento}-${municipio}`
      if (municipalities.has(municipalityKey)) {
        municipality = municipalities.get(municipalityKey)
      } else {
        municipality = await db.municipality.create({
          data: {
            name: municipio,
            code: `MUN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            departmentId: dept.id
          }
        })
        municipalities.set(municipalityKey, municipality)
        results.push({ type: 'municipality', departamento, municipio })
      }

      // Create polling station
      try {
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
          type: 'polling_station',
          departamento,
          municipio,
          puesto,
          address: direccion
        })
        processed++
      } catch (error) {
        console.error('Error creating polling station:', error)
        errors++
      }

      // Log progress every 50 records
      if (processed % 50 === 0) {
        console.log(`Processed ${processed} records...`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Datos de elecciones Cámara y Senado 2026 cargados exitosamente',
      data: {
        processed,
        errors,
        total: lines.length,
        departments: departments.size,
        municipalities: municipalities.size
      }
    })

  } catch (error) {
    console.error('Error loading Colombia data:', error)
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
        municipality: {
          department: {
            name: 'asc'
          }
        }
      },
      take: 500 // Return first 500 for preview
    })

    return NextResponse.json({
      success: true,
      data: pollingStations,
      total: await db.pollingStation.count(),
      departments: await db.department.count(),
      municipalities: await db.municipality.count()
    })
  } catch (error) {
    console.error('Error fetching Colombia data:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al obtener los datos de las elecciones Cámara y Senado 2026'
    }, { status: 500 })
  }
}
