import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

// Nueva contraseña para todos los usuarios
const NEW_PASSWORD = '731026'

async function updatePasswords() {
  console.log('🔐 Actualizando contraseñas de todos los usuarios...\n')
  
  try {
    // Hashear la nueva contraseña usando el mismo método que la app
    console.log('🔒 Hasheando contraseña con pbkdf2...')
    const hashedPassword = hashPassword(NEW_PASSWORD)
    console.log(`  ✓ Contraseña hasheada: ${hashedPassword.substring(0, 30)}...\n`)
    
    // Actualizar candidatos
    console.log('👤 Actualizando candidatos...')
    const candidates = await prisma.candidate.findMany({
      select: { id: true, name: true, document: true }
    })
    
    for (const candidate of candidates) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { password: hashedPassword }
      })
      console.log(`  ✓ Candidato: ${candidate.name} (${candidate.document})`)
    }
    console.log(`  ✓ Total candidatos actualizados: ${candidates.length}\n`)
    
    // Actualizar líderes
    console.log('👥 Actualizando líderes...')
    const leaders = await prisma.leader.findMany({
      select: { id: true, name: true, document: true }
    })
    
    for (const leader of leaders) {
      await prisma.leader.update({
        where: { id: leader.id },
        data: { password: hashedPassword }
      })
      console.log(`  ✓ Líder: ${leader.name} (${leader.document})`)
    }
    console.log(`  ✓ Total líderes actualizados: ${leaders.length}\n`)
    
    // Resumen
    console.log('✅ Actualización completada exitosamente!')
    console.log(`\n📊 Resumen:`)
    console.log(`  - Candidatos: ${candidates.length}`)
    console.log(`  - Líderes: ${leaders.length}`)
    console.log(`  - Total usuarios: ${candidates.length + leaders.length}`)
    console.log(`\n🔑 Nueva contraseña para todos: ${NEW_PASSWORD}`)
    
    // Mostrar lista de usuarios actualizados
    console.log(`\n📋 Usuarios actualizados:`)
    console.log(`\nCANDIDATOS:`)
    candidates.forEach(c => {
      console.log(`  - ${c.name} (Cédula: ${c.document}) → Contraseña: ${NEW_PASSWORD}`)
    })
    
    console.log(`\nLÍDERES:`)
    leaders.forEach(l => {
      console.log(`  - ${l.name} (Cédula: ${l.document}) → Contraseña: ${NEW_PASSWORD}`)
    })
    
  } catch (error: any) {
    console.error('\n❌ Error al actualizar contraseñas:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar actualización
updatePasswords()
  .then(() => {
    console.log('\n🎉 Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  })
