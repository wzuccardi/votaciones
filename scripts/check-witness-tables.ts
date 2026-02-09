/**
 * Script para verificar las mesas asignadas a los testigos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando mesas asignadas a testigos...\n');
  
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
  });
  
  if (witnesses.length === 0) {
    console.log('❌ No hay testigos registrados\n');
    return;
  }
  
  console.log(`📊 Total de testigos: ${witnesses.length}\n`);
  
  witnesses.forEach((witness, index) => {
    console.log(`${index + 1}. ${witness.voter.name} (${witness.voter.document})`);
    console.log(`   Puesto: ${witness.pollingStation.name}`);
    console.log(`   assignedTables (raw): ${witness.assignedTables}`);
    
    try {
      const tables = JSON.parse(witness.assignedTables);
      console.log(`   Mesas asignadas (parsed): ${JSON.stringify(tables)}`);
      console.log(`   Número de mesas: ${tables.length}`);
      console.log(`   Tipo: ${typeof tables}, Es array: ${Array.isArray(tables)}`);
    } catch (error) {
      console.log(`   ❌ Error al parsear JSON: ${error}`);
    }
    
    console.log('');
  });
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
