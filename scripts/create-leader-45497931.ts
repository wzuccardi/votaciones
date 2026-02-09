import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function createLeader() {
  try {
    console.log('🔍 Buscando candidato...')
    
    // Buscar el candidato
    const candidate = await prisma.candidate.findFirst()
    
    if (!candidate) {
      console.log('❌ No se encontró ningún candidato')
      console.log('💡 Primero debes crear un candidato')
      return
    }
    
    console.log(`✅ Candidato encontrado: ${candidate.name}`)
    
    // Verificar si el líder ya existe
    const existingLeader = await prisma.leader.findUnique({
      where: { document: '45497931' }
    })
    
    if (existingLeader) {
      console.log('📝 El líder ya existe, actualizando contraseña...')
      
      const hashedPassword = await hashPassword('731026')
      
      await prisma.leader.update({
        where: { id: existingLeader.id },
        data: { password: hashedPassword }
      })
      
      console.log('✅ Contraseña actualizada')
    } else {
      console.log('📝 Creando nuevo líder...')
      
      const hashedPassword = await hashPassword('731026')
      
      await prisma.leader.create({
        data: {
          document: '45497931',
          name: 'Prueba Supabase',
          password: hashedPassword,
          candidateId: candidate.id
        }
      })
      
      console.log('✅ Líder creado exitosamente')
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 LÍDER LISTO PARA USAR')
    console.log('='.repeat(60))
    console.log('\n📝 CREDENCIALES:')
    console.log('   Rol: Líder')
    console.log('   Cédula: 45497931')
    console.log('   Contraseña: 731026')
    console.log(`   Candidato: ${candidate.name}`)
    console.log('\n🔗 PARA HACER LOGIN:')
    console.log('   1. Ve a http://localhost:3000/login')
    console.log('   2. Selecciona rol: "Líder"')
    console.log('   3. Ingresa cédula: 45497931')
    console.log('   4. Ingresa contraseña: 731026')
    console.log('   5. Click en "Iniciar Sesión"')
    console.log('\n' + '='.repeat(60))
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createLeader()
