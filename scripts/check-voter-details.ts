import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkVoterDetails() {
  try {
    console.log('🔍 Verificando detalles de votantes de María...\n')

    // Obtener votantes de María
    const mariaLeader = await prisma.leader.findFirst({
      where: {
        name: {
          contains: 'Maria de los Angeles'
        }
      }
    })

    if (!mariaLeader) {
      console.log('❌ No se encontró el líder María')
      return
    }

    const voters = await prisma.voter.findMany({
      where: {
        leaderId: mariaLeader.id
      },
      include: {
        pollingStation: true,
        municipality: true
      }
    })

    console.log(`Líder: ${mariaLeader.name}`)
    console.log(`Total votantes: ${voters.length}\n`)

    voters.forEach((voter, index) => {
      console.log(`${index + 1}. ${voter.name} (${voter.document})`)
      console.log(`   Municipio: ${voter.municipality?.name || '❌ NO ASIGNADO'}`)
      console.log(`   Puesto: ${voter.pollingStation?.name || '❌ NO ASIGNADO'}`)
      console.log(`   Mesa: ${voter.tableNumber || '❌ NO ASIGNADO'}`)
      console.log(`   ✅ Aparecerá en reporte: ${voter.pollingStationId && voter.tableNumber ? 'SÍ' : 'NO'}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVoterDetails()