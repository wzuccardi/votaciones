import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function countPollingStations() {
  try {
    console.log('📊 Contando puestos de votación...\n')
    
    // Total de puestos
    const total = await prisma.pollingStation.count()
    console.log(`✅ Total de puestos de votación: ${total}`)
    
    // Por municipio
    const byMunicipality = await prisma.pollingStation.groupBy({
      by: ['municipalityId'],
      _count: true
    })
    
    console.log(`\n📍 Puestos por municipio: ${byMunicipality.length} municipios`)
    
    // Top 10 municipios con más puestos
    const municipalities = await Promise.all(
      byMunicipality.map(async (item) => {
        const municipality = await prisma.municipality.findUnique({
          where: { id: item.municipalityId }
        })
        return {
          name: municipality?.name || 'Desconocido',
          count: item._count
        }
      })
    )
    
    municipalities.sort((a, b) => b.count - a.count)
    
    console.log('\n🏆 Top 10 municipios con más puestos:')
    municipalities.slice(0, 10).forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name}: ${m.count} puestos`)
    })
    
    // Verificar si hay puestos sin municipio
    const withoutMunicipality = await prisma.pollingStation.count({
      where: { municipalityId: null }
    })
    
    if (withoutMunicipality > 0) {
      console.log(`\n⚠️  ${withoutMunicipality} puestos sin municipio asignado`)
    }
    
    console.log('\n' + '='.repeat(60))
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

countPollingStations()
