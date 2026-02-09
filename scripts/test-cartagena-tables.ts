import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCartagenaTables() {
  console.log('🧪 Probando mesas en puestos de Cartagena...\n')
  
  try {
    // Obtener puestos de Cartagena
    const cartagena = await prisma.municipality.findFirst({
      where: { name: 'CARTAGENA' }
    })
    
    if (!cartagena) {
      console.log('❌ No se encontró el municipio de Cartagena')
      return
    }
    
    const pollingStations = await prisma.pollingStation.findMany({
      where: { municipalityId: cartagena.id },
      take: 20,
      include: {
        municipality: true,
        voters: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log(`📊 Analizando ${pollingStations.length} puestos de Cartagena:\n`)
    
    const results: any[] = []
    
    for (const station of pollingStations) {
      let numberOfTables = 10
      
      const registeredVoters = station.voters.length
      if (registeredVoters > 0) {
        numberOfTables = Math.max(5, Math.ceil(registeredVoters / 350))
      }
      
      const stationName = station.name.toUpperCase()
      
      if (
        stationName.includes('UNIVERSIDAD') ||
        stationName.includes('UNIV.') ||
        stationName.includes('CENTRO COMERCIAL') ||
        stationName.includes('COLISEO') ||
        stationName.includes('SENA')
      ) {
        numberOfTables = Math.max(numberOfTables, 30)
      } else if (
        stationName.includes('COLEGIO') ||
        stationName.includes('COL.') ||
        stationName.includes('I.E.') ||
        stationName.includes('IE ') ||
        stationName.includes('INST.')
      ) {
        numberOfTables = Math.max(numberOfTables, 15)
      }
      
      numberOfTables = Math.max(numberOfTables, 20) // Mínimo para Cartagena
      numberOfTables = Math.min(numberOfTables, 100)
      
      results.push({
        name: station.name,
        tables: numberOfTables,
        voters: registeredVoters
      })
      
      console.log(`📍 ${station.name}`)
      console.log(`   Votantes: ${registeredVoters}`)
      console.log(`   Mesas: ${numberOfTables} (Mesa 1 a Mesa ${numberOfTables})`)
      console.log('')
    }
    
    // Ordenar por número de mesas
    results.sort((a, b) => b.tables - a.tables)
    
    console.log('\n🏆 Top 5 puestos con más mesas:')
    results.slice(0, 5).forEach((r, i) => {
      console.log(`${i + 1}. ${r.name}: ${r.tables} mesas`)
    })
    
    console.log('\n📊 Estadísticas:')
    console.log(`   Mínimo de mesas: ${Math.min(...results.map(r => r.tables))}`)
    console.log(`   Máximo de mesas: ${Math.max(...results.map(r => r.tables))}`)
    console.log(`   Promedio: ${Math.round(results.reduce((sum, r) => sum + r.tables, 0) / results.length)}`)
    
    console.log('\n✅ Prueba completada')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

testCartagenaTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect())
