import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDuplicates() {
  try {
    console.log('🔍 Buscando puestos duplicados...\n')
    
    const stations = await prisma.pollingStation.findMany({
      include: {
        municipality: true
      },
      orderBy: [
        { municipality: { name: 'asc' } },
        { name: 'asc' }
      ]
    })
    
    const stationMap = new Map<string, any[]>()
    
    stations.forEach(station => {
      const key = `${station.municipality.name}|${station.name}`
      if (!stationMap.has(key)) {
        stationMap.set(key, [])
      }
      stationMap.get(key)!.push(station)
    })
    
    const duplicates = Array.from(stationMap.entries()).filter(([_, stations]) => stations.length > 1)
    
    if (duplicates.length > 0) {
      console.log(`❌ Se encontraron ${duplicates.length} puestos duplicados:\n`)
      
      duplicates.forEach(([key, stations]) => {
        const [municipio, puesto] = key.split('|')
        console.log(`📍 ${municipio} - ${puesto}`)
        console.log(`   Aparece ${stations.length} veces:`)
        stations.forEach(s => {
          console.log(`   - ID: ${s.id}, Código: ${s.code}`)
        })
        console.log()
      })
      
      console.log(`\n💡 Total de registros duplicados: ${duplicates.reduce((sum, [_, s]) => sum + s.length - 1, 0)}`)
    } else {
      console.log('✅ No se encontraron puestos duplicados')
    }
    
    console.log(`\n📊 Total de puestos en BD: ${stations.length}`)
    console.log(`📊 Puestos únicos: ${stationMap.size}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicates()
