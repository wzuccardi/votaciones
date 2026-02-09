import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function fixLeaderPassword() {
  try {
    const document = '45497931'
    const newPassword = '731026'
    
    console.log('🔍 Buscando líder con cédula:', document)
    
    const leader = await prisma.leader.findUnique({
      where: { document }
    })
    
    if (!leader) {
      console.log('❌ No se encontró el líder')
      
      // Mostrar todos los líderes
      console.log('\n📋 Líderes en la base de datos:')
      const allLeaders = await prisma.leader.findMany({
        select: {
          document: true,
          name: true
        }
      })
      
      if (allLeaders.length === 0) {
        console.log('   No hay líderes registrados')
      } else {
        allLeaders.forEach(l => {
          console.log(`   - Cédula: ${l.document}, Nombre: ${l.name}`)
        })
      }
      return
    }
    
    console.log(`✅ Líder encontrado: ${leader.name}`)
    console.log('🔐 Actualizando contraseña...')
    
    const hashedPassword = await hashPassword(newPassword)
    
    await prisma.leader.update({
      where: { id: leader.id },
      data: { password: hashedPassword }
    })
    
    console.log('✅ Contraseña actualizada exitosamente')
    console.log('\n📝 Credenciales actualizadas:')
    console.log(`   Rol: Líder`)
    console.log(`   Cédula: ${document}`)
    console.log(`   Contraseña: ${newPassword}`)
    console.log('\n🔗 Ahora puedes hacer login en:')
    console.log('   http://localhost:3000/login')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixLeaderPassword()
