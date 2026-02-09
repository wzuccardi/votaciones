import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testApiData() {
  console.log('🧪 Probando datos para API...\n')
  
  try {
    // 1. Obtener departamentos
    const departments = await prisma.department.findMany()
    console.log('✅ Departamentos disponibles:')
    departments.forEach(d => {
      console.log(`   - ${d.name} (${d.code})`)
    })
    
    // 2. Obtener municipios de Bolívar
    const bolivar = departments.find(d => d.code === '13')
    if (bolivar) {
      const municipalities = await prisma.municipality.findMany({
        where: { departmentId: bolivar.id },
        orderBy: { name: 'asc' }
      })
      
      console.log(`\n✅ Municipios de Bolívar (${municipalities.length}):`)
      municipalities.slice(0, 10).forEach(m => {
        console.log(`   - ${m.name}`)
      })
      if (municipalities.length > 10) {
        console.log(`   ... y ${municipalities.length - 10} más`)
      }
      
      // 3. Obtener puestos de Cartagena
      const cartagena = municipalities.find(m => m.name === 'CARTAGENA')
      if (cartagena) {
        const pollingStations = await prisma.pollingStation.findMany({
          where: { municipalityId: cartagena.id },
          orderBy: { name: 'asc' },
          take: 10
        })
        
        console.log(`\n✅ Puestos de votación en Cartagena (primeros 10 de ${pollingStations.length}):`)
        pollingStations.forEach(ps => {
          console.log(`   - ${ps.name}`)
          console.log(`     Dirección: ${ps.address || 'N/A'}`)
          console.log(`     Comuna: ${ps.community || 'N/A'}`)
        })
      }
    }
    
    console.log('\n✅ Datos listos para usar en la aplicación')
    console.log('\n📝 Endpoints disponibles:')
    console.log('   - GET /api/data/departments')
    console.log('   - GET /api/data/municipalities?departmentId=<id>')
    console.log('   - GET /api/data/polling-stations?municipalityId=<id>')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

testApiData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect())
