import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function verifyImport() {
  console.log('🔍 Verificando importación de DIVIPOLA...\n')
  
  try {
    // 1. Contar departamentos
    const departmentCount = await prisma.department.count()
    console.log(`✓ Departamentos: ${departmentCount}`)
    
    const departments = await prisma.department.findMany({
      select: { id: true, name: true, code: true }
    })
    departments.forEach(dept => {
      console.log(`  - ${dept.name} (${dept.code})`)
    })
    
    // 2. Contar municipios
    const municipalityCount = await prisma.municipality.count()
    console.log(`\n✓ Municipios: ${municipalityCount}`)
    
    const municipalities = await prisma.municipality.findMany({
      select: { name: true, code: true },
      orderBy: { name: 'asc' },
      take: 10
    })
    console.log('  Primeros 10 municipios:')
    municipalities.forEach(mun => {
      console.log(`  - ${mun.name} (${mun.code})`)
    })
    
    // 3. Contar puestos de votación
    const pollingStationCount = await prisma.pollingStation.count()
    console.log(`\n✓ Puestos de votación: ${pollingStationCount}`)
    
    const pollingStations = await prisma.pollingStation.findMany({
      select: { name: true, code: true, totalVoters: true, totalTables: true },
      orderBy: { totalVoters: 'desc' },
      take: 5
    })
    console.log('  Top 5 puestos por votantes:')
    pollingStations.forEach(ps => {
      console.log(`  - ${ps.name}: ${ps.totalVoters} votantes, ${ps.totalTables} mesas`)
    })
    
    // 4. Contar mesas
    const tableCount = await prisma.table.count()
    console.log(`\n✓ Mesas: ${tableCount}`)
    
    // 5. Verificar relaciones
    const municipalityWithStations = await prisma.municipality.findFirst({
      where: {
        pollingStations: {
          some: {}
        }
      },
      include: {
        pollingStations: {
          take: 3,
          select: { name: true, totalVoters: true }
        }
      }
    })
    
    if (municipalityWithStations) {
      console.log(`\n✓ Relaciones verificadas:`)
      console.log(`  Municipio: ${municipalityWithStations.name}`)
      console.log(`  Puestos de votación:`)
      municipalityWithStations.pollingStations.forEach(ps => {
        console.log(`    - ${ps.name} (${ps.totalVoters} votantes)`)
      })
    }
    
    // 6. Verificar datos específicos de Cartagena
    const cartagena = await prisma.municipality.findFirst({
      where: { name: 'CARTAGENA' },
      include: {
        _count: {
          select: { pollingStations: true }
        }
      }
    })
    
    if (cartagena) {
      console.log(`\n✓ Datos de Cartagena:`)
      console.log(`  - Puestos de votación: ${cartagena._count.pollingStations}`)
    }
    
    console.log('\n✅ Verificación completada exitosamente!')
    
  } catch (error: any) {
    console.error('\n❌ Error durante la verificación:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyImport()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
