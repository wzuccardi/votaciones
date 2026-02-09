import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyImport() {
  console.log('🔍 Verificando importación de datos...\n')
  
  try {
    // 1. Verificar departamentos
    const departments = await prisma.department.findMany()
    console.log(`📊 Departamentos: ${departments.length}`)
    departments.forEach(d => console.log(`  - ${d.name} (${d.code})`))
    
    // 2. Verificar municipios
    const municipalities = await prisma.municipality.count()
    console.log(`\n📊 Municipios: ${municipalities}`)
    
    // 3. Verificar puestos de votación
    const pollingStations = await prisma.pollingStation.findMany({
      include: {
        municipality: true,
        tables: true
      }
    })
    console.log(`\n📊 Puestos de votación: ${pollingStations.length}`)
    
    // 4. Verificar mesas
    const totalTables = await prisma.table.count()
    console.log(`\n📊 Mesas electorales: ${totalTables}`)
    
    // 5. Estadísticas de votantes
    const totalVoters = pollingStations.reduce((sum, ps) => sum + ps.totalVoters, 0)
    const totalMale = pollingStations.reduce((sum, ps) => sum + ps.maleVoters, 0)
    const totalFemale = pollingStations.reduce((sum, ps) => sum + ps.femaleVoters, 0)
    
    console.log(`\n📊 Estadísticas de votantes:`)
    console.log(`  - Total: ${totalVoters.toLocaleString()}`)
    console.log(`  - Hombres: ${totalMale.toLocaleString()} (${Math.round((totalMale/totalVoters)*100)}%)`)
    console.log(`  - Mujeres: ${totalFemale.toLocaleString()} (${Math.round((totalFemale/totalVoters)*100)}%)`)
    
    // 6. Top 10 puestos con más votantes
    const topStations = pollingStations
      .sort((a, b) => b.totalVoters - a.totalVoters)
      .slice(0, 10)
    
    console.log(`\n🏆 Top 10 puestos con más votantes:`)
    topStations.forEach((ps, i) => {
      console.log(`${i + 1}. ${ps.name}`)
      console.log(`   Municipio: ${ps.municipality.name}`)
      console.log(`   Votantes: ${ps.totalVoters.toLocaleString()}`)
      console.log(`   Mesas: ${ps.totalTables}`)
      console.log(`   Mesas en BD: ${ps.tables.length}`)
    })
    
    // 7. Verificar integridad
    console.log(`\n🔍 Verificando integridad de datos...`)
    
    let errors = 0
    for (const ps of pollingStations) {
      // Verificar que el número de mesas coincida
      if (ps.tables.length !== ps.totalTables) {
        console.log(`  ⚠️  ${ps.name}: Esperadas ${ps.totalTables} mesas, encontradas ${ps.tables.length}`)
        errors++
      }
      
      // Verificar que la suma de votantes coincida
      if (ps.maleVoters + ps.femaleVoters !== ps.totalVoters) {
        console.log(`  ⚠️  ${ps.name}: Suma de votantes no coincide (${ps.maleVoters} + ${ps.femaleVoters} ≠ ${ps.totalVoters})`)
        errors++
      }
    }
    
    if (errors === 0) {
      console.log(`  ✅ Todos los datos son consistentes`)
    } else {
      console.log(`  ⚠️  Se encontraron ${errors} inconsistencias`)
    }
    
    // 8. Ejemplos de puestos
    console.log(`\n📋 Ejemplos de puestos de votación:`)
    
    const examples = pollingStations.slice(0, 3)
    for (const ps of examples) {
      console.log(`\n  📍 ${ps.name}`)
      console.log(`     Municipio: ${ps.municipality.name}`)
      console.log(`     Dirección: ${ps.address || 'N/A'}`)
      console.log(`     Comuna: ${ps.community || 'N/A'}`)
      console.log(`     Votantes: ${ps.totalVoters.toLocaleString()} (${ps.maleVoters} H, ${ps.femaleVoters} M)`)
      console.log(`     Mesas: ${ps.totalTables} (${ps.tables.map(t => t.number).slice(0, 5).join(', ')}${ps.tables.length > 5 ? '...' : ''})`)
      console.log(`     Cámara: ${ps.camara ? 'Sí' : 'No'}`)
      console.log(`     Senado: ${ps.senado ? 'Sí' : 'No'}`)
    }
    
    console.log('\n✅ Verificación completada')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

verifyImport()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect())
