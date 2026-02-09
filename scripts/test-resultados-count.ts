/**
 * Script para verificar el conteo de mesas en el dashboard de resultados
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testResultadosCount() {
  console.log('🧪 PRUEBA DE CONTEO DE MESAS EN RESULTADOS\n');
  console.log('═'.repeat(60));

  // Obtener el candidato de prueba
  const candidate = await prisma.candidate.findFirst({
    where: { document: '123456789' }
  });

  if (!candidate) {
    console.log('❌ No se encontró el candidato de prueba (123456789)');
    return;
  }

  console.log(`✅ Candidato encontrado: ${candidate.name} (${candidate.id})\n`);

  // Obtener todos los líderes del candidato
  const leaders = await prisma.leader.findMany({
    where: { candidateId: candidate.id }
  });

  console.log(`📊 Líderes del candidato: ${leaders.length}\n`);

  // Obtener todos los testigos del candidato
  const witnesses = await prisma.electoralWitness.findMany({
    where: {
      leader: {
        candidateId: candidate.id
      }
    },
    include: {
      voter: { select: { name: true } },
      pollingStation: { select: { name: true } }
    }
  });

  console.log(`📊 Testigos del candidato: ${witnesses.length}\n`);

  // Calcular total de mesas asignadas
  let totalMesas = 0;
  witnesses.forEach((w, i) => {
    const tables = JSON.parse(w.assignedTables);
    totalMesas += tables.length;
    console.log(`${i + 1}. ${w.voter.name}`);
    console.log(`   Puesto: ${w.pollingStation.name}`);
    console.log(`   Mesas asignadas: ${tables.length} (${tables.join(', ')})`);
    console.log('');
  });

  console.log('═'.repeat(60));
  console.log('📋 RESUMEN\n');
  console.log(`Total de testigos: ${witnesses.length}`);
  console.log(`Total de mesas asignadas: ${totalMesas}`);
  console.log('');

  // Verificar mesas reportadas
  const reportedTables = await prisma.table.findMany({
    where: {
      witness: {
        leader: {
          candidateId: candidate.id
        }
      },
      reportedAt: { not: null }
    }
  });

  console.log(`Mesas reportadas: ${reportedTables.length}`);
  console.log('');

  // Resultado esperado
  console.log('═'.repeat(60));
  console.log('✅ RESULTADO ESPERADO EN EL DASHBOARD:\n');
  console.log(`Mesas Reportadas: ${reportedTables.length} / ${totalMesas}`);
  console.log(`Porcentaje: ${totalMesas > 0 ? Math.round((reportedTables.length / totalMesas) * 100) : 0}%`);
  console.log('');

  if (totalMesas === 4) {
    console.log('✅ CORRECTO: El dashboard debe mostrar "0 / 4" mesas');
  } else {
    console.log(`⚠️  ATENCIÓN: Se esperaban 4 mesas pero se encontraron ${totalMesas}`);
  }
  console.log('');
}

testResultadosCount()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
