import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testChecklist() {
  console.log('🧪 Probando funcionalidad de checklist...\n')
  
  try {
    // 1. Verificar si hay testigos en la base de datos
    const witnesses = await prisma.electoralWitness.findMany({
      include: {
        voter: {
          select: {
            name: true,
            document: true
          }
        },
        pollingStation: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log(`📊 Total de testigos en BD: ${witnesses.length}\n`)
    
    if (witnesses.length === 0) {
      console.log('⚠️  No hay testigos en la base de datos.')
      console.log('   Crea un testigo desde la aplicación primero.\n')
      return
    }
    
    // 2. Mostrar estado del checklist de cada testigo
    console.log('📋 Estado del checklist por testigo:\n')
    
    witnesses.forEach((witness, index) => {
      console.log(`${index + 1}. ${witness.voter.name} (${witness.voter.document})`)
      console.log(`   Puesto: ${witness.pollingStation.name}`)
      console.log(`   Código único: ${witness.uniqueCode || 'N/A'}`)
      console.log(`   Checklist:`)
      console.log(`     ✓ Confirmó asistencia: ${witness.confirmedAttendance ? '✅' : '❌'}`)
      console.log(`     ✓ Recibió credencial: ${witness.receivedCredential ? '✅' : '❌'}`)
      console.log(`     ✓ Llegó al puesto: ${witness.arrivedAtStation ? '✅' : '❌'}`)
      console.log(`     ✓ Reportó inicio: ${witness.reportedVotingStart ? '✅' : '❌'}`)
      console.log(`     ✓ Reportó cierre: ${witness.reportedVotingEnd ? '✅' : '❌'}`)
      console.log(`     ✓ Entregó acta: ${witness.deliveredAct ? '✅' : '❌'}`)
      
      const completed = [
        witness.confirmedAttendance,
        witness.receivedCredential,
        witness.arrivedAtStation,
        witness.reportedVotingStart,
        witness.reportedVotingEnd,
        witness.deliveredAct
      ].filter(Boolean).length
      
      console.log(`   Progreso: ${completed}/6 (${Math.round((completed/6)*100)}%)`)
      
      if (witness.arrivedAt) {
        console.log(`   Timestamps:`)
        if (witness.arrivedAt) console.log(`     - Llegó: ${witness.arrivedAt.toLocaleString('es-CO')}`)
        if (witness.votingStartAt) console.log(`     - Inicio: ${witness.votingStartAt.toLocaleString('es-CO')}`)
        if (witness.votingEndAt) console.log(`     - Cierre: ${witness.votingEndAt.toLocaleString('es-CO')}`)
        if (witness.actDeliveredAt) console.log(`     - Acta: ${witness.actDeliveredAt.toLocaleString('es-CO')}`)
      }
      
      console.log('')
    })
    
    // 3. Estadísticas generales
    const totalChecks = witnesses.length * 6
    const completedChecks = witnesses.reduce((sum, w) => {
      return sum + [
        w.confirmedAttendance,
        w.receivedCredential,
        w.arrivedAtStation,
        w.reportedVotingStart,
        w.reportedVotingEnd,
        w.deliveredAct
      ].filter(Boolean).length
    }, 0)
    
    console.log('📊 Estadísticas generales:')
    console.log(`   Total de checks posibles: ${totalChecks}`)
    console.log(`   Checks completados: ${completedChecks}`)
    console.log(`   Progreso general: ${Math.round((completedChecks/totalChecks)*100)}%`)
    
    const fullyCompleted = witnesses.filter(w => 
      w.confirmedAttendance &&
      w.receivedCredential &&
      w.arrivedAtStation &&
      w.reportedVotingStart &&
      w.reportedVotingEnd &&
      w.deliveredAct
    ).length
    
    console.log(`   Testigos con checklist completo: ${fullyCompleted}/${witnesses.length}`)
    
    console.log('\n✅ Verificación completada')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

testChecklist()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect())
