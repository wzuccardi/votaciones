import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

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
  municipalitiesUpdated: number
  pollingStationsCreated: number
  pollingStationsUpdated: number
  pollingStationsDeleted: number
  errors: string[]
}

async function updateBolivarData(): Promise<ImportReport> {
  console.log('🔄 Actualizando datos del departamento de Bolívar...\n')
  
  const report: ImportReport = {
    departmentCreated: false,
    municipalitiesCreated: 0,
    municipalitiesUpdated: 0,
    pollingStationsCreated: 0,
    pollingStationsUpdated: 0,
    pollingStationsDeleted: 0,
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
    
    // 2. Parsear CSV (delimitador: punto y coma)
    const bolivarRows: CSVRow[] = []
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(';')
      
      if (values.length >= 11 && values[0] === BOLIVAR_NAME) {
        bolivarRows.push({
          departamento: values[0].trim(),
          municipio: values[1].trim(),
          puesto: values[2].trim(),
          comuna: values[3].trim(),
          direccion: values[4].trim(),
          alcaldia: values[5].trim(),
          gobernacion: values[6].trim(),
          concejo: values[7].trim(),
          asamblea: values[8].trim(),
          jal: values[9].trim(),
          cantidad: values[10].trim()
        })
      }
    }
    
    console.log(`  ✓ Registros de Bolívar encontrados: ${bolivarRows.length}`)
    
    if (bolivarRows.length === 0) {
      throw new Error('No se encontraron datos para el departamento de Bolívar')
    }
    
    // 3. Verificar/Crear departamento de Bolívar
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
    
    // 4. Obtener municipios únicos del CSV
    const uniqueMunicipalities = [...new Set(bolivarRows.map(r => r.municipio))]
    console.log(`\n🏘️  Municipios únicos en CSV: ${uniqueMunicipalities.length}`)
    
    // 5. Obtener municipios existentes
    const existingMunicipalities = await prisma.municipality.findMany({
      where: { departmentId: bolivar.id }
    })
    
    console.log(`  ℹ️  Municipios existentes en BD: ${existingMunicipalities.length}`)
    
    // 6. Crear/Actualizar municipios
    const municipalityMap = new Map<string, string>() // nombre -> id
    
    for (const municipioName of uniqueMunicipalities) {
      try {
        // Buscar si ya existe
        const existing = existingMunicipalities.find(m => m.name === municipioName)
        
        if (existing) {
          municipalityMap.set(municipioName, existing.id)
          report.municipalitiesUpdated++
        } else {
          // Generar código único para el municipio
          const municipioCode = `${BOLIVAR_CODE}${String(existingMunicipalities.length + report.municipalitiesCreated + 1).padStart(3, '0')}`
          
          const municipality = await prisma.municipality.create({
            data: {
              name: municipioName,
              code: municipioCode,
              departmentId: bolivar.id
            }
          })
          
          municipalityMap.set(municipioName, municipality.id)
          report.municipalitiesCreated++
        }
        
        if ((report.municipalitiesCreated + report.municipalitiesUpdated) % 10 === 0) {
          console.log(`  ✓ Procesados ${report.municipalitiesCreated + report.municipalitiesUpdated} municipios...`)
        }
      } catch (error: any) {
        report.errors.push(`Error procesando municipio ${municipioName}: ${error.message}`)
      }
    }
    
    console.log(`  ✓ Municipios creados: ${report.municipalitiesCreated}`)
    console.log(`  ✓ Municipios existentes: ${report.municipalitiesUpdated}`)
    
    // 7. Obtener puestos existentes
    const existingPollingStations = await prisma.pollingStation.findMany({
      where: {
        municipality: {
          departmentId: bolivar.id
        }
      },
      include: {
        municipality: true
      }
    })
    
    console.log(`\n🗳️  Puestos de votación existentes en BD: ${existingPollingStations.length}`)
    
    // 8. Crear mapa de puestos existentes por nombre y municipio
    const existingStationsMap = new Map<string, any>()
    existingPollingStations.forEach(station => {
      const key = `${station.municipality.name}|${station.name}`
      existingStationsMap.set(key, station)
    })
    
    // 9. Crear/Actualizar puestos de votación
    console.log(`\n🔄 Procesando puestos de votación...`)
    
    const processedStations = new Set<string>()
    
    for (let i = 0; i < bolivarRows.length; i++) {
      const row = bolivarRows[i]
      
      try {
        const municipalityId = municipalityMap.get(row.municipio)
        if (!municipalityId) {
          report.errors.push(`Municipio no encontrado: ${row.municipio}`)
          continue
        }
        
        const stationKey = `${row.municipio}|${row.puesto}`
        processedStations.add(stationKey)
        
        const existingStation = existingStationsMap.get(stationKey)
        
        if (existingStation) {
          // Actualizar puesto existente
          await prisma.pollingStation.update({
            where: { id: existingStation.id },
            data: {
              address: row.direccion || null,
              community: row.comuna || null,
              alcaldia: row.alcaldia || null,
              gobernacion: row.gobernacion || null,
              concejo: row.concejo || null,
              asamblea: row.asamblea || null,
              jal: row.jal || null,
              cantidad: row.cantidad || null
            }
          })
          
          report.pollingStationsUpdated++
        } else {
          // Crear nuevo puesto
          const puestoCode = `${BOLIVAR_CODE}-${String(existingPollingStations.length + report.pollingStationsCreated + 1).padStart(4, '0')}`
          
          await prisma.pollingStation.create({
            data: {
              name: row.puesto,
              code: puestoCode,
              address: row.direccion || null,
              community: row.comuna || null,
              latitude: null,
              longitude: null,
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
        }
        
        if ((report.pollingStationsCreated + report.pollingStationsUpdated) % 100 === 0) {
          console.log(`  ✓ Procesados ${report.pollingStationsCreated + report.pollingStationsUpdated} puestos...`)
        }
      } catch (error: any) {
        report.errors.push(`Error procesando puesto ${row.puesto}: ${error.message}`)
      }
    }
    
    console.log(`  ✓ Puestos creados: ${report.pollingStationsCreated}`)
    console.log(`  ✓ Puestos actualizados: ${report.pollingStationsUpdated}`)
    
    // 10. Eliminar puestos que ya no están en el CSV (opcional - comentado por seguridad)
    /*
    console.log(`\n🗑️  Verificando puestos obsoletos...`)
    for (const [key, station] of existingStationsMap) {
      if (!processedStations.has(key)) {
        await prisma.pollingStation.delete({
          where: { id: station.id }
        })
        report.pollingStationsDeleted++
      }
    }
    console.log(`  ✓ Puestos eliminados: ${report.pollingStationsDeleted}`)
    */
    
    // 11. Generar reporte
    console.log('\n📊 Resumen de actualización:')
    console.log(`  - Departamento: ${report.departmentCreated ? 'Creado' : 'Ya existía'}`)
    console.log(`  - Municipios creados: ${report.municipalitiesCreated}`)
    console.log(`  - Municipios existentes: ${report.municipalitiesUpdated}`)
    console.log(`  - Puestos creados: ${report.pollingStationsCreated}`)
    console.log(`  - Puestos actualizados: ${report.pollingStationsUpdated}`)
    console.log(`  - Puestos eliminados: ${report.pollingStationsDeleted}`)
    console.log(`  - Errores: ${report.errors.length}`)
    
    if (report.errors.length > 0) {
      console.log('\n⚠️  Errores encontrados:')
      report.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`))
      if (report.errors.length > 10) {
        console.log(`  ... y ${report.errors.length - 10} errores más`)
      }
    }
    
    // 12. Guardar reporte
    const reportPath = 'update-bolivar-report.json'
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Reporte guardado en: ${reportPath}`)
    
    // 13. Verificar tamaño final
    const dbPath = 'prisma/dev.db'
    const stats = fs.statSync(dbPath)
    const sizeKB = (stats.size / 1024).toFixed(2)
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
    const finalSize = stats.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`
    
    console.log(`\n📏 Tamaño final de la base de datos: ${finalSize}`)
    
    console.log('\n✅ Actualización completada exitosamente!')
    
    return report
    
  } catch (error: any) {
    console.error('\n❌ Error durante la actualización:', error.message)
    throw error
  }
}

// Ejecutar actualización
updateBolivarData()
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
