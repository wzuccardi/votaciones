import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testTablesAPI() {
  console.log('🧪 Probando generación de mesas por puesto...\n')
  
  try {
    // Obtener algunos puestos de votación de ejemplo
    const pollingStations = await prisma.pollingStation.findMany({
      take: 10,
      include: {
        municipality: true,
        voters: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log(`📊 Analizando ${pollingStations.length} puestos de votación:\n`)
    
    for (const station of pollingStations) {
      // Simular la lógica de la API
      let numberOfTables = 10 // Por defecto
      
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
      } else if (
        stationName.includes('VEREDA') ||
        stationName.includes('CORREGIMIENTO') ||
        stationName.includes('RURAL')
      ) {
        numberOfTables = Math.max(5, Math.min(numberOfTables, 10))
      }
      
      if (station.municipality.name === 'CARTAGENA') {
        numberOfTables = Math.max(numberOfTables, 20)
      }
      
      numberOfTables = Math.min(numberOfTables, 100)
      
      console.log(`📍 ${station.name}`)
      console.log(`   Municipio: ${station.municipality.name}`)
      console.log(`   Votantes registrados: ${registeredVoters}`)
      console.log(`   Mesas estimadas: ${numberOfTables}`)
      console.log(`   Rango: Mesa 1 a Mesa ${numberOfTables}`)
      console.log('')
    }
    
    // Estadísticas generales
    const totalStations = await prisma.pollingStation.count()
    console.log(`\n📊 Estadísticas generales:`)
    console.log(`   Total de puestos en BD: ${totalStations}`)
    console.log(`   Puestos analizados: ${pollingStations.length}`)
    
    const avgTables = pollingStations.reduce((sum, station) => {
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
      if (station.municipality.name === 'CARTAGENA') {
        numberOfTables = Math.max(numberOfTables, 20)
      }
      numberOfTables = Math.min(numberOfTables, 100)
      return sum + numberOfTables
    }, 0) / pollingStations.length
    
    console.log(`   Promedio de mesas por puesto: ${Math.round(avgTables)}`)
    
    console.log('\n✅ Prueba completada')
    console.log('\n💡 Ahora puedes probar la API en:')
    console.log('   GET /api/data/tables?pollingStationId=<id>')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

testTablesAPI()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect())
