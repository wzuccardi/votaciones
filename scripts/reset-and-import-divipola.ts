import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

interface CSVRow {
  departamento: string
  municipio: string
  puesto: string
  mujeres: string
  hombres: string
  total: string
  mesas: string
  comuna: string
  direccion: string
}

interface ImportReport {
  databaseCleared: boolean
  departmentsCreated: number
  municipalitiesCreated: number
  pollingStationsCreated: number
  tablesCreated: number
  errors: string[]
}

async function clearDatabase() {
  console.log('🗑️  Limpiando base de datos...\n')
  
  // Eliminar datos en orden (respetando foreign keys)
  await prisma.table.deleteMany()
  console.log('  ✓ Mesas eliminadas')
  
  await prisma.electoralWitness.deleteMany()
  console.log('  ✓ Testigos electorales eliminados')
  
  await prisma.voter.deleteMany()
  console.log('  ✓ Votantes eliminados')
  
  await prisma.leader.deleteMany()
  console.log('  ✓ Líderes eliminados')
  
  await prisma.candidate.deleteMany()
  console.log('  ✓ Candidatos eliminados')
  
  await prisma.documentIndex.deleteMany()
  console.log('  ✓ Índice de documentos eliminado')
  
  await prisma.pollingStation.deleteMany()
  console.log('  ✓ Puestos de votación eliminados')
  
  await prisma.municipality.deleteMany()
  console.log('  ✓ Municipios eliminados')
  
  await prisma.department.deleteMany()
  console.log('  ✓ Departamentos eliminados')
  
  console.log('\n✅ Base de datos limpiada exitosamente\n')
}

async function importDivipolaUltimate(): Promise<ImportReport> {
  console.log('🔄 Importando datos de DIVIPOLA ULTIMATE...\n')
  
  const report: ImportReport = {
    databaseCleared: false,
    departmentsCreated: 0,
    municipalitiesCreated: 0,
    pollingStationsCreated: 0,
    tablesCreated: 0,
    errors: []
  }
  
  try {
    // 1. Limpiar base de datos
    await clearDatabase()
    report.databaseCleared = true
    
    // 2. Leer archivo CSV
    const csvPath = 'Genio/DvipolaUltimate.csv'
    console.log(`📄 Leyendo archivo: ${csvPath}`)
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`Archivo CSV no encontrado: ${csvPath}`)
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n')
    
    console.log(`  ✓ Total de líneas en CSV: ${lines.length}`)
    
    // 3. Parsear CSV (delimitador: punto y coma)
    const rows: CSVRow[] = []
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(';')
      
      if (values.length >= 9) {
        rows.push({
          departamento: values[0].trim(),
          municipio: values[1].trim(),
          puesto: values[2].trim(),
          mujeres: values[3].trim(),
          hombres: values[4].trim(),
          total: values[5].trim(),
          mesas: values[6].trim(),
          comuna: values[7].trim(),
          direccion: values[8].trim()
        })
      }
    }
    
    console.log(`  ✓ Registros válidos encontrados: ${rows.length}\n`)
    
    if (rows.length === 0) {
      throw new Error('No se encontraron datos válidos en el CSV')
    }
    
    // 4. Obtener departamentos únicos
    const uniqueDepartments = [...new Set(rows.map(r => r.departamento))]
    console.log(`🏛️  Departamentos únicos: ${uniqueDepartments.length}`)
    
    // 5. Crear departamentos
    const departmentMap = new Map<string, string>() // nombre -> id
    
    for (const deptName of uniqueDepartments) {
      try {
        const deptCode = deptName.substring(0, 2).toUpperCase()
        
        const department = await prisma.department.create({
          data: {
            name: deptName,
            code: deptCode
          }
        })
        
        departmentMap.set(deptName, department.id)
        report.departmentsCreated++
        console.log(`  ✓ Departamento creado: ${deptName}`)
      } catch (error: any) {
        report.errors.push(`Error creando departamento ${deptName}: ${error.message}`)
      }
    }
    
    // 6. Obtener municipios únicos por departamento
    const municipiosByDept = new Map<string, Set<string>>()
    
    rows.forEach(row => {
      if (!municipiosByDept.has(row.departamento)) {
        municipiosByDept.set(row.departamento, new Set())
      }
      municipiosByDept.get(row.departamento)!.add(row.municipio)
    })
    
    console.log(`\n🏘️  Creando municipios...`)
    
    // 7. Crear municipios
    const municipalityMap = new Map<string, string>() // "dept|municipio" -> id
    let munCount = 0
    
    for (const [deptName, municipios] of municipiosByDept) {
      const deptId = departmentMap.get(deptName)
      if (!deptId) continue
      
      for (const munName of municipios) {
        try {
          const munCode = `${deptName.substring(0, 2)}${String(munCount).padStart(3, '0')}`
          
          const municipality = await prisma.municipality.create({
            data: {
              name: munName,
              code: munCode,
              departmentId: deptId
            }
          })
          
          municipalityMap.set(`${deptName}|${munName}`, municipality.id)
          report.municipalitiesCreated++
          munCount++
          
          if (munCount % 10 === 0) {
            console.log(`  ✓ Procesados ${munCount} municipios...`)
          }
        } catch (error: any) {
          report.errors.push(`Error creando municipio ${munName}: ${error.message}`)
        }
      }
    }
    
    console.log(`  ✓ Total municipios creados: ${report.municipalitiesCreated}`)
    
    // 8. Crear puestos de votación
    console.log(`\n🗳️  Creando puestos de votación...`)
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      try {
        const munKey = `${row.departamento}|${row.municipio}`
        const municipalityId = municipalityMap.get(munKey)
        
        if (!municipalityId) {
          report.errors.push(`Municipio no encontrado: ${munKey}`)
          continue
        }
        
        // Parsear datos numéricos
        const totalVoters = parseInt(row.total) || 0
        const maleVoters = parseInt(row.hombres) || 0
        const femaleVoters = parseInt(row.mujeres) || 0
        const totalTables = parseInt(row.mesas) || 0
        
        const puestoCode = `${row.departamento.substring(0, 2)}-${String(i).padStart(4, '0')}`
        
        const newStation = await prisma.pollingStation.create({
          data: {
            name: row.puesto,
            code: puestoCode,
            address: row.direccion || null,
            community: row.comuna || null,
            totalVoters,
            maleVoters,
            femaleVoters,
            totalTables,
            camara: true,
            senado: true,
            municipalityId
          }
        })
        
        // Crear mesas para este puesto
        if (totalTables > 0) {
          const tables = []
          for (let tableNum = 1; tableNum <= totalTables; tableNum++) {
            tables.push({
              number: tableNum,
              pollingStationId: newStation.id
            })
          }
          
          await prisma.table.createMany({
            data: tables
          })
          
          report.tablesCreated += totalTables
        }
        
        report.pollingStationsCreated++
        
        if (report.pollingStationsCreated % 50 === 0) {
          console.log(`  ✓ Procesados ${report.pollingStationsCreated} puestos...`)
        }
      } catch (error: any) {
        report.errors.push(`Error procesando puesto ${row.puesto}: ${error.message}`)
      }
    }
    
    console.log(`  ✓ Total puestos creados: ${report.pollingStationsCreated}`)
    console.log(`  ✓ Total mesas creadas: ${report.tablesCreated}`)
    
    // 9. Generar reporte
    console.log('\n📊 Resumen de importación:')
    console.log(`  - Base de datos limpiada: ${report.databaseCleared ? 'Sí' : 'No'}`)
    console.log(`  - Departamentos creados: ${report.departmentsCreated}`)
    console.log(`  - Municipios creados: ${report.municipalitiesCreated}`)
    console.log(`  - Puestos creados: ${report.pollingStationsCreated}`)
    console.log(`  - Mesas creadas: ${report.tablesCreated}`)
    console.log(`  - Errores: ${report.errors.length}`)
    
    if (report.errors.length > 0) {
      console.log('\n⚠️  Errores encontrados:')
      report.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`))
      if (report.errors.length > 10) {
        console.log(`  ... y ${report.errors.length - 10} errores más`)
      }
    }
    
    // 10. Guardar reporte
    const reportPath = 'import-divipola-ultimate-report.json'
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Reporte guardado en: ${reportPath}`)
    
    console.log('\n✅ Importación completada exitosamente!')
    
    return report
    
  } catch (error: any) {
    console.error('\n❌ Error durante la importación:', error.message)
    throw error
  }
}

// Ejecutar importación
importDivipolaUltimate()
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
