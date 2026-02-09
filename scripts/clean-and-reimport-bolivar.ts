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

async function cleanAndReimport() {
  console.log('🧹 Limpiando y reimportando datos de Bolívar...\n')
  
  try {
    // 1. Obtener departamento de Bolívar
    const bolivar = await prisma.department.findUnique({
      where: { code: BOLIVAR_CODE }
    })
    
    if (!bolivar) {
      throw new Error('Departamento de Bolívar no encontrado')
    }
    
    console.log(`🎯 Departamento: ${bolivar.name} (${bolivar.code})\n`)
    
    // 2. Eliminar todos los puestos de votación de Bolívar
    console.log('🗑️  Eliminando puestos de votación existentes...')
    const deletedStations = await prisma.pollingStation.deleteMany({
      where: { municipality: { departmentId: bolivar.id } }
    })
    console.log(`  ✓ Eliminados: ${deletedStations.count} puestos\n`)
    
    // 3. Eliminar todos los municipios de Bolívar
    console.log('🗑️  Eliminando municipios existentes...')
    const deletedMunicipalities = await prisma.municipality.deleteMany({
      where: { departmentId: bolivar.id }
    })
    console.log(`  ✓ Eliminados: ${deletedMunicipalities.count} municipios\n`)
    
    // 4. Leer CSV actualizado
    const csvPath = 'Genio/Divipole_Elecciones_Territoritoriales_2023_con_georreferenciación_20260119 (1).csv'
    console.log(`📄 Leyendo CSV: ${csvPath}`)
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n')
    console.log(`  ✓ Total de líneas: ${lines.length}\n`)
    
    // 5. Parsear CSV (separado por punto y coma)
    const bolivarRows: CSVRow[] = []
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(';')
      if (values.length < 11) continue
      
      if (values[0] === BOLIVAR_NAME) {
        bolivarRows.push({
          departamento: values[0],
          municipio: values[1],
          puesto: values[2],
          comuna: values[3],
          direccion: values[4],
          alcaldia: values[5],
          gobernacion: values[6],
          concejo: values[7],
          asamblea: values[8],
          jal: values[9],
          cantidad: values[10]
        })
      }
    }
    
    console.log(`📊 Registros de Bolívar encontrados: ${bolivarRows.length}\n`)
    
    if (bolivarRows.length === 0) {
      throw new Error('No se encontraron datos de Bolívar en el CSV')
    }
    
    // 6. Obtener municipios únicos
    const uniqueMunicipalities = [...new Set(bolivarRows.map(r => r.municipio))]
    console.log(`🏘️  Municipios únicos: ${uniqueMunicipalities.length}`)
    
    // 7. Crear municipios
    const municipalityMap = new Map<string, string>()
    let municipalitiesCreated = 0
    
    for (const municipioName of uniqueMunicipalities) {
      const municipioCode = `${BOLIVAR_CODE}${String(municipalitiesCreated + 1).padStart(3, '0')}`
      
      const municipality = await prisma.municipality.create({
        data: {
          name: municipioName,
          code: municipioCode,
          departmentId: bolivar.id
        }
      })
      
      municipalityMap.set(municipioName, municipality.id)
      municipalitiesCreated++
      
      if (municipalitiesCreated % 10 === 0) {
        console.log(`  ✓ Creados ${municipalitiesCreated} municipios...`)
      }
    }
    
    console.log(`  ✓ Total municipios creados: ${municipalitiesCreated}\n`)
    
    // 8. Crear puestos de votación
    console.log(`🗳️  Creando puestos de votación...`)
    let stationsCreated = 0
    
    for (let i = 0; i < bolivarRows.length; i++) {
      const row = bolivarRows[i]
      const municipalityId = municipalityMap.get(row.municipio)
      
      if (!municipalityId) {
        console.log(`  ⚠️  Municipio no encontrado: ${row.municipio}`)
        continue
      }
      
      const puestoCode = `${BOLIVAR_CODE}-${String(i + 1).padStart(4, '0')}`
      
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
      
      stationsCreated++
      
      if (stationsCreated % 100 === 0) {
        console.log(`  ✓ Creados ${stationsCreated} puestos...`)
      }
    }
    
    console.log(`  ✓ Total puestos creados: ${stationsCreated}\n`)
    
    // 9. Verificar tamaño final
    const dbPath = 'prisma/dev.db'
    const stats = fs.statSync(dbPath)
    const sizeKB = (stats.size / 1024).toFixed(2)
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
    const finalSize = stats.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`
    
    console.log(`📊 Resumen final:`)
    console.log(`  - Departamento: Bolívar`)
    console.log(`  - Municipios: ${municipalitiesCreated}`)
    console.log(`  - Puestos de votación: ${stationsCreated}`)
    console.log(`  - Tamaño de DB: ${finalSize}`)
    
    console.log('\n✅ Importación completada exitosamente!')
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanAndReimport()
  .then(() => {
    console.log('\n🎉 Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  })
