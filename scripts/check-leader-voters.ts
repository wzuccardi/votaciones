import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLeaderVoters() {
  try {
    console.log('🔍 Verificando conteo de votantes por líder...\n')

    // Obtener todos los líderes con conteo
    const leaders = await prisma.leader.findMany({
      include: {
        _count: {
          select: {
            voters: true
          }
        },
        voters: {
          select: {
            id: true,
            name: true,
            document: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`Total de líderes: ${leaders.length}\n`)

    leaders.forEach(leader => {
      console.log(`📊 Líder: ${leader.name}`)
      console.log(`   Cédula: ${leader.document}`)
      console.log(`   _count.voters: ${leader._count.voters}`)
      console.log(`   voters.length: ${leader.voters.length}`)
      
      if (leader._count.voters !== leader.voters.length) {
        console.log(`   ⚠️  DISCREPANCIA DETECTADA!`)
      }
      
      if (leader.voters.length > 0) {
        console.log(`   Votantes:`)
        leader.voters.forEach(voter => {
          console.log(`     - ${voter.name} (${voter.document})`)
        })
      }
      console.log('')
    })

    // Verificar votantes sin líder
    const votersWithoutLeader = await prisma.voter.findMany({
      where: {
        leaderId: null
      },
      select: {
        id: true,
        name: true,
        document: true
      }
    })

    if (votersWithoutLeader.length > 0) {
      console.log(`⚠️  Votantes sin líder asignado: ${votersWithoutLeader.length}`)
      votersWithoutLeader.forEach(voter => {
        console.log(`   - ${voter.name} (${voter.document})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLeaderVoters()