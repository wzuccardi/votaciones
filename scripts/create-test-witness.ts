import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function createTestWitness() {
  try {
    console.log('🔍 Buscando candidato y líder...')
    
    // Buscar candidato
    const candidate = await prisma.candidate.findFirst()
    if (!candidate) {
      console.error('❌ No se encontró ningún candidato')
      return
    }
    console.log(`✅ Candidato encontrado: ${candidate.name}`)
    
    // Buscar líder
    const leader = await prisma.leader.findFirst({
      where: { candidateId: candidate.id }
    })
    if (!leader) {
      console.error('❌ No se encontró ningún líder')
      return
    }
    console.log(`✅ Líder encontrado: ${leader.name}`)
    
    // Buscar puesto de votación
    const pollingStation = await prisma.pollingStation.findFirst()
    if (!pollingStation) {
      console.error('❌ No se encontró ningún puesto de votación')
      return
    }
    console.log(`✅ Puesto encontrado: ${pollingStation.name}`)
    
    // Verificar si ya existe el votante testigo
    const existingVoter = await prisma.voter.findUnique({
      where: { document: '111222333' }
    })
    
    let voter
    if (existingVoter) {
      console.log('📝 Votante testigo ya existe, actualizando...')
      voter = await prisma.voter.update({
        where: { id: existingVoter.id },
        data: {
          password: await hashPassword('Testigo2026!'),
          leaderId: leader.id,
          pollingStationId: pollingStation.id,
          tableNumber: '1'
        }
      })
    } else {
      console.log('📝 Creando votante testigo...')
      voter = await prisma.voter.create({
        data: {
          document: '111222333',
          name: 'Testigo de Prueba',
          password: await hashPassword('Testigo2026!'),
          leaderId: leader.id,
          pollingStationId: pollingStation.id,
          tableNumber: '1',
          celular: '3001234567',
          email: 'testigo@prueba.com'
        }
      })
    }
    console.log(`✅ Votante creado/actualizado: ${voter.name}`)
    
    // Verificar si ya es testigo
    const existingWitness = await prisma.electoralWitness.findUnique({
      where: { voterId: voter.id }
    })
    
    let witness
    if (existingWitness) {
      console.log('📝 Ya es testigo electoral, actualizando...')
      witness = await prisma.electoralWitness.update({
        where: { id: existingWitness.id },
        data: {
          assignedTables: JSON.stringify([1, 2]),
          uniqueCode: existingWitness.uniqueCode || generateUniqueCode()
        }
      })
    } else {
      console.log('📝 Asignando como testigo electoral...')
      witness = await prisma.electoralWitness.create({
        data: {
          voterId: voter.id,
          leaderId: leader.id,
          pollingStationId: pollingStation.id,
          assignedTables: JSON.stringify([1, 2]),
          status: 'ASSIGNED',
          experience: 'FIRST_TIME',
          availability: 'FULL_DAY',
          hasTransport: false,
          uniqueCode: generateUniqueCode()
        }
      })
    }
    console.log(`✅ Testigo electoral creado/actualizado`)
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 TESTIGO DE PRUEBA CREADO EXITOSAMENTE')
    console.log('='.repeat(60))
    console.log('\n📋 CREDENCIALES PARA LOGIN:')
    console.log('   Rol: Testigo Electoral')
    console.log('   Cédula: 111222333')
    console.log('   Contraseña: Testigo2026!')
    console.log(`   Código único: ${witness.uniqueCode}`)
    console.log('\n📍 DATOS DEL TESTIGO:')
    console.log(`   Nombre: ${voter.name}`)
    console.log(`   Puesto: ${pollingStation.name}`)
    console.log(`   Mesas asignadas: 1, 2`)
    console.log(`   Líder: ${leader.name}`)
    console.log('\n🔗 PARA PROBAR:')
    console.log('   1. Ve a http://localhost:3000/login')
    console.log('   2. Selecciona rol: "Testigo Electoral"')
    console.log('   3. Ingresa cédula: 111222333')
    console.log('   4. Ingresa contraseña: Testigo2026!')
    console.log('   5. Serás redirigido a tu dashboard de testigo')
    console.log('\n' + '='.repeat(60))
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

createTestWitness()
