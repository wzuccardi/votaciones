import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeDatabase() {
  console.log('🔍 Analizando base de datos...\n')

  try {
    // Contar registros en cada tabla
    const candidatesCount = await prisma.candidate.count()
    const leadersCount = await prisma.leader.count()
    const votersCount = await prisma.voter.count()
    const departmentsCount = await prisma.department.count()
    const municipalitiesCount = await prisma.municipality.count()
    const pollingStationsCount = await prisma.pollingStation.count()
    const documentIndexCount = await prisma.documentIndex.count()

    console.log('📊 Conteo de registros:')
    console.log(`  - Candidatos: ${candidatesCount}`)
    console.log(`  - Líderes: ${leadersCount}`)
    console.log(`  - Votantes: ${votersCount}`)
    console.log(`  - Departamentos: ${departmentsCount}`)
    console.log(`  - Municipios: ${municipalitiesCount}`)
    console.log(`  - Puestos de votación: ${pollingStationsCount}`)
    console.log(`  - Índice de documentos: ${documentIndexCount}`)
    console.log(`\n📈 Total de registros: ${candidatesCount + leadersCount + votersCount + departmentsCount + municipalitiesCount + pollingStationsCount + documentIndexCount}`)

    // Obtener tamaño de campos grandes
    console.log('\n🔍 Analizando campos grandes...')
    
    const candidates = await prisma.candidate.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        photoUrl: true,
      }
    })

    for (const candidate of candidates) {
      console.log(`\n  Candidato: ${candidate.name}`)
      if (candidate.logoUrl) {
        console.log(`    - Logo URL length: ${candidate.logoUrl.length} caracteres`)
        if (candidate.logoUrl.startsWith('data:')) {
          console.log(`    - ⚠️ Logo es base64 embebido (${Math.round(candidate.logoUrl.length / 1024)}KB)`)
        }
      }
      if (candidate.photoUrl) {
        console.log(`    - Photo URL length: ${candidate.photoUrl.length} caracteres`)
        if (candidate.photoUrl.startsWith('data:')) {
          console.log(`    - ⚠️ Photo es base64 embebido (${Math.round(candidate.photoUrl.length / 1024)}KB)`)
        }
      }
    }

    // Verificar puestos de votación con datos largos
    const pollingStations = await prisma.pollingStation.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        address: true,
        community: true,
        alcaldia: true,
        gobernacion: true,
        concejo: true,
        asamblea: true,
        jal: true,
      }
    })

    console.log('\n📍 Muestra de puestos de votación:')
    for (const station of pollingStations) {
      const totalLength = (station.address?.length || 0) + 
                         (station.community?.length || 0) + 
                         (station.alcaldia?.length || 0) + 
                         (station.gobernacion?.length || 0) + 
                         (station.concejo?.length || 0) + 
                         (station.asamblea?.length || 0) + 
                         (station.jal?.length || 0)
      console.log(`  - ${station.name}: ${totalLength} caracteres en campos de texto`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeDatabase()
