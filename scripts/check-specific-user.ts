import { PrismaClient } from '@prisma/client'
import { verifyPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const document = '45497931'
    const password = '731026'
    
    console.log('🔍 Buscando líder con cédula:', document)
    
    const leader = await prisma.leader.findUnique({
      where: { document },
      include: { candidate: true }
    })
    
    if (!leader) {
      console.log('❌ No se encontró ningún líder con esa cédula')
      console.log('\n📋 Líderes disponibles:')
      const allLeaders = await prisma.leader.findMany({
        select: {
          document: true,
          name: true,
          candidate: {
            select: { name: true }
          }
        }
      })
      allLeaders.forEach(l => {
        console.log(`   - Cédula: ${l.document}, Nombre: ${l.name}, Candidato: ${l.candidate.name}`)
      })
      return
    }
    
    console.log('✅ Líder encontrado:')
    console.log(`   Nombre: ${leader.name}`)
    console.log(`   Cédula: ${leader.document}`)
    console.log(`   Candidato: ${leader.candidate.name}`)
    console.log(`   ID: ${leader.id}`)
    
    console.log('\n🔐 Verificando contraseña...')
    const isValid = verifyPassword(password, leader.password)
    
    if (isValid) {
      console.log('✅ La contraseña es CORRECTA')
      console.log('\n📝 Credenciales válidas:')
      console.log(`   Rol: Líder`)
      console.log(`   Cédula: ${document}`)
      console.log(`   Contraseña: ${password}`)
    } else {
      console.log('❌ La contraseña es INCORRECTA')
      console.log('\n🔧 Para actualizar la contraseña, ejecuta:')
      console.log('   npx tsx scripts/update-passwords.ts')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
