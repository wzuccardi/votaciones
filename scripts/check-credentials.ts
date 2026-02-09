/**
 * Script para verificar credenciales de usuarios
 */

import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando credenciales de usuarios...\n');
  
  // Verificar candidatos
  console.log('👔 CANDIDATOS:');
  const candidates = await prisma.candidate.findMany({
    select: {
      id: true,
      name: true,
      document: true,
      party: true,
      password: true,
    }
  });
  
  if (candidates.length === 0) {
    console.log('   ❌ No hay candidatos registrados\n');
  } else {
    candidates.forEach((candidate, index) => {
      console.log(`\n   ${index + 1}. ${candidate.name}`);
      console.log(`      Documento: ${candidate.document}`);
      console.log(`      Partido: ${candidate.party}`);
      console.log(`      Password hash: ${candidate.password.substring(0, 50)}...`);
      
      // Probar contraseña común
      const testPasswords = ['731026', 'Test123456', 'password', '123456'];
      let found = false;
      
      for (const pwd of testPasswords) {
        try {
          const isValid = verifyPassword(pwd, candidate.password);
          if (isValid) {
            console.log(`      ✅ Contraseña válida: "${pwd}"`);
            found = true;
            break;
          }
        } catch (error) {
          // Ignorar errores de verificación
        }
      }
      
      if (!found) {
        console.log(`      ⚠️  Contraseña no coincide con las comunes probadas`);
      }
    });
  }
  
  // Verificar líderes
  console.log('\n\n👥 LÍDERES:');
  const leaders = await prisma.leader.findMany({
    select: {
      id: true,
      name: true,
      document: true,
      password: true,
      candidateId: true,
    }
  });
  
  if (leaders.length === 0) {
    console.log('   ❌ No hay líderes registrados\n');
  } else {
    leaders.forEach((leader, index) => {
      console.log(`\n   ${index + 1}. ${leader.name}`);
      console.log(`      Documento: ${leader.document}`);
      console.log(`      Candidato ID: ${leader.candidateId}`);
      console.log(`      Password hash: ${leader.password.substring(0, 50)}...`);
      
      // Probar contraseña común
      const testPasswords = ['731026', 'Test123456', 'password', '123456'];
      let found = false;
      
      for (const pwd of testPasswords) {
        try {
          const isValid = verifyPassword(pwd, leader.password);
          if (isValid) {
            console.log(`      ✅ Contraseña válida: "${pwd}"`);
            found = true;
            break;
          }
        } catch (error) {
          // Ignorar errores de verificación
        }
      }
      
      if (!found) {
        console.log(`      ⚠️  Contraseña no coincide con las comunes probadas`);
      }
    });
  }
  
  console.log('\n\n📋 RESUMEN:');
  console.log(`   Candidatos: ${candidates.length}`);
  console.log(`   Líderes: ${leaders.length}`);
  
  if (candidates.length === 0 && leaders.length === 0) {
    console.log('\n⚠️  No hay usuarios para iniciar sesión.');
    console.log('💡 Ejecuta: npx tsx scripts/update-passwords.ts');
  }
  
  console.log('\n✅ Verificación completada');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
