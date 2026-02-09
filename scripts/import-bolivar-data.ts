import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Código DANE del departamento de Bolívar
const BOLIVAR_CODE = '13'
const BOLIVAR_NAME = 'BOLIVAR'

interface CSVRow {
  departamento: string
  municipio: string
  puesto: string
  comuna: string
  direccion: string
  latitud: string
  longitud: string
  alcaldia: string
  gobernacion: string
  concejo: string
  asamblea: string
  jal: string
  cantidad: string
}

interface ImportReport {
  departmentCreated: boolean
  municipalitiesCreated: number
  pollingStationsCreated: number
  errors: string[]
}

async function importBolivarData(): Promise<ImportReport> {
  console.log('📥 Importando datos del departamento de Bolívar...\n')
  
  const report: ImportReport = {
    departmentCreated: false,
    municipalitiesCreated: 0,
    pollingStationsCreated: 0,
    errors: []
  }
  
  try {
    // 1. Leer archivo CSV
    const csvPath = 'Genio/Divipole_Elecciones_Territoritoriales_2023_con_georreferenciación_20260119 (1).csv'
    console.log(`📄 Leyendo archivo: ${csvPath}`)
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`Archivo CSV no encontrado: ${csvPath}`)
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n')
    
    console.log(`  ✓ Total de líneas en CSV: ${lines.length}`)
    
    // 2. Parsear CSV y filtrar solo Bolívar
    const bolivarRows: CSVRow[] = []
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i].trim()
      if (!line) continue
      
      // Parse CSV line (simple parser, assumes no commas in quoted fields)
      const matches = line.match(/"([^"]*)"/g)
      if (!matches || matches.length < 13) continue
      
      const values = matches.map(m => m.replace(/^"|"$/g, ''))
      
      if (values[0] === BOLIVAR_NAME) {
        bolivarRows.push({
          departamento: values[0],
          municipio: values[1],
          puesto: values[2],
          comuna: values[3],
          direccion: values[4],
          latitud: values[5],
          longitud: values[6],
          alcaldia: values[7],
          gobernacion: values[8],
          concejo: values[9],
          asamblea: values[10],
          jal: values[11],
          cantidad: values[12]
        })
      }
    }
    
    console.log(`  ✓ Registros de Bolívar encontrados: ${bolivarRows.length}`)
    
    if (bolivarRows.length === 0) {
      throw new Error('No se encontraron datos para el departamento de Bolívar')
    }
    
    // 3. Verificar que el departamento de Bolívar existe
    let bolivar = await prisma.department.findUnique({
      where: { code: BOLIVAR_CODE }
    })
    
    if (!bolivar) {
      console.log('\n🏛️  Creando departamento de Bolívar...')
      bolivar = await prisma.department.create({
        data: {
          name: 'Bolívar',
          code: BOLIVAR_CODE
        }
      })
      report.departmentCreated = true
      console.log(`  ✓ Departamento creado: ${bolivar.name} (${bolivar.code})`)
    } else {
      console.log(`\n🏛️  Departamento de Bolívar ya existe: ${bolivar.name} (${bolivar.code})`)
    }
    
    // 4. Obtener municipios únicos
    const uniqueMunicipalities = [...new Set(bolivarRows.map(r => r.municipio))]
    console.log(`\n🏘️  Municipios únicos encontrados: ${uniqueMunicipalities.length}`)
    
    // 5. Crear municipios
    const municipalityMap = new Map<string, string>() // nombre -> id
    
    for (const municipioName of uniqueMunicipalities) {
      try {
        // Generar código único para el municipio (simplificado)
        const municipioCode = `${BOLIVAR_CODE}${String(report.municipalitiesCreated + 1).padStart(3, '0')}`
        
        const municipality = await prisma.municipality.upsert({
          where: { code: municipioCode },
          update: {},
          create: {
            name: municipioName,
            code: municipioCode,
            departmentId: bolivar.id
          }
        })
        
        municipalityMap.set(municipioName, municipality.id)
        report.municipalitiesCreated++
        
        if (report.municipalitiesCreated % 10 === 0) {
          console.log(`  ✓ Procesados ${report.municipalitiesCreated} municipios...`)
        }
      } catch (error: any) {
        report.errors.push(`Error creando municipio ${municipioName}: ${error.message}`)
      }
    }
    
    console.log(`  ✓ Total de municipios creados: ${report.municipalitiesCreated}`)
    
    // 6. Crear puestos de votación
    console.log(`\n🗳️  Creando puestos de votación...`)
    
    for (let i = 0; i < bolivarRows.length; i++) {
      const row = bolivarRows[i]
      
      try {
        const municipalityId = municipalityMap.get(row.municipio)
        if (!municipalityId) {
          report.errors.push(`Municipio no encontrado: ${row.municipio}`)
          continue
        }
        
        // Generar código único para el puesto
        const puestoCode = `${BOLIVAR_CODE}-${String(i + 1).padStart(4, '0')}`
        
        await prisma.pollingStation.create({
          data: {
            name: row.puesto,
            code: puestoCode,
            address: row.direccion || null,
            community: row.comuna || null,
            latitude: row.latitud ? parseFloat(row.latitud) : null,
            longitude: row.longitud ? parseFloat(row.longitud) : null,
            alcaldia: row.alcaldia || null,
            gobernacion: row.gobernacion || null,
            concejo: row.concejo || null,
            asamblea: row.asamblea || null,
            jal: row.jal || null,
            cantidad: row.cantidad || null,
            municipalityId
          }
        })
        
        report.pollingStationsCreated++
        
        if (report.pollingStationsCreated % 100 === 0) {
          console.log(`  ✓ Procesados ${report.pollingStationsCreated} puestos...`)
        }
      } catch (error: any) {
        report.errors.push(`Error creando puesto ${row.puesto}: ${error.message}`)
      }
    }
    
    console.log(`  ✓ Total de puestos creados: ${report.pollingStationsCreated}`)
    
    // 7. Generar reporte
    console.log('\n📊 Resumen de importación:')
    console.log(`  - Departamento: ${report.departmentCreated ? 'Creado' : 'Ya existía'}`)
    console.log(`  - Municipios creados: ${report.municipalitiesCreated}`)
    console.log(`  - Puestos de votación creados: ${report.pollingStationsCreated}`)
    console.log(`  - Errores: ${report.errors.length}`)
    
    if (report.errors.length > 0) {
      console.log('\n⚠️  Errores encontrados:')
      report.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`))
      if (report.errors.length > 10) {
        console.log(`  ... y ${report.errors.length - 10} errores más`)
      }
    }
    
    // 8. Guardar reporte
    const reportPath = 'import-bolivar-report.json'
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Reporte guardado en: ${reportPath}`)
    
    // 9. Verificar tamaño final
    const dbPath = 'prisma/dev.db'
    const stats = fs.statSync(dbPath)
    const sizeKB = (stats.size / 1024).toFixed(2)
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
    const finalSize = stats.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`
    
    console.log(`\n📏 Tamaño final de la base de datos: ${finalSize}`)
    
    console.log('\n✅ Importación completada exitosamente!')
    
    return report
    
  } catch (error: any) {
    console.error('\n❌ Error durante la importación:', error.message)
    throw error
  }
}

// Ejecutar importación
importBolivarData()
  .then(() => {
    console.log('\n🎉 Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
