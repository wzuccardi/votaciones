import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyData() {
  console.log('🔍 Verificando datos en la base de datos...\n')
  
  try {
    // 1. Verificar departamentos
    const departments = await prisma.department.findMany()
    console.log(`📊 Departamentos: ${departments.length}`)
    departments.forEach(d => console.log(`  - ${d.name} (${d.code})`))
    
    // 2. Verificar municipios
    const municipalities = await prisma.municipality.findMany({
      include: {
        department: true
      }
    })
    console.log(`\n📊 Municipios: ${municipalities.length}`)
    
    // Agrupar por departamento
    const byDept = municipalities.reduce((acc, m) => {
      const deptName = m.department.name
      if (!acc[deptName]) acc[deptName] = []
      acc[deptName].push(m.name)
      return acc
    }, {} as Record<string, string[]>)
    
    Object.entries(byDept).forEach(([dept, munis]) => {
      console.log(`  ${dept}: ${munis.length} municipios`)
      munis.slice(0, 5).forEach(m => console.log(`    - ${m}`))
      if (munis.length > 5) {
        console.log(`    ... y ${munis.length - 5} más`)
      }
    })
    
    // 3. Verificar puestos de votación
    const pollingStations = await prisma.pollingStation.findMany({
      include: {
        municipality: {
          include: {
            department: true
          }
        }
      }
    })
    console.log(`\n📊 Puestos de votación: ${pollingStations.length}`)
    
    // Agrupar por municipio
    const byMuni = pollingStations.reduce((acc, ps) => {
      const muniName = ps.municipality.name
      if (!acc[muniName]) acc[muniName] = 0
      acc[muniName]++
      return acc
    }, {} as Record<string, number>)
    
    console.log(`\n  Top 10 municipios con más puestos:`)
    Object.entries(byMuni)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([muni, count]) => {
        console.log(`    - ${muni}: ${count} puestos`)
      })
    
    // 4. Mostrar algunos puestos de ejemplo
    console.log(`\n  Ejemplos de puestos de votación:`)
    pollingStations.slice(0, 5).forEach(ps => {
      console.log(`    - ${ps.name}`)
      console.log(`      Municipio: ${ps.municipality.name}`)
      console.log(`      Comuna: ${ps.community || 'N/A'}`)
      console.log(`      Dirección: ${ps.address || 'N/A'}`)
    })
    
    // 5. Verificar votantes
    const voters = await prisma.voter.count()
    console.log(`\n📊 Votantes: ${voters}`)
    
    // 6. Verificar líderes
    const leaders = await prisma.leader.count()
    console.log(`📊 Líderes: ${leaders}`)
    
    // 7. Verificar candidatos
    const candidates = await prisma.candidate.count()
    console.log(`📊 Candidatos: ${candidates}`)
    
    // 8. Verificar testigos electorales
    const witnesses = await prisma.electoralWitness.count()
    console.log(`📊 Testigos electorales: ${witnesses}`)
    
    console.log('\n✅ Verificación completada')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

verifyData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect())
