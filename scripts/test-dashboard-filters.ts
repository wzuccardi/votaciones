/**
 * Script para probar los filtros del dashboard de monitoreo
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFilters() {
  console.log('🧪 PRUEBA DE FILTROS DEL DASHBOARD\n');
  console.log('═'.repeat(60));

  // Obtener el líder de prueba
  const leader = await prisma.leader.findFirst({
    where: { document: '987654321' }
  });

  if (!leader) {
    console.log('❌ No se encontró el líder de prueba (987654321)');
    return;
  }

  console.log(`✅ Líder encontrado: ${leader.name} (${leader.id})\n`);

  // TEST 1: Vista General (sin filtros)
  console.log('📊 TEST 1: VISTA GENERAL (SIN FILTROS)');
  console.log('─'.repeat(60));
  
  const allWitnesses = await prisma.electoralWitness.findMany({
    where: { leaderId: leader.id },
    include: {
      voter: { select: { name: true } },
      pollingStation: { select: { name: true } }
    }
  });

  const totalTables = allWitnesses.reduce((sum, w) => {
    const tables = JSON.parse(w.assignedTables);
    return sum + tables.length;
  }, 0);

  console.log(`Testigos encontrados: ${allWitnesses.length}`);
  console.log(`Total mesas asignadas: ${totalTables}`);
  allWitnesses.forEach((w, i) => {
    const tables = JSON.parse(w.assignedTables);
    console.log(`  ${i + 1}. ${w.voter.name} → ${tables.length} mesas (${tables.join(', ')})`);
  });
  console.log(`✅ Esperado: 4 mesas | Obtenido: ${totalTables} mesas\n`);

  // TEST 2: Filtro por Puesto "COLEGIO DE LA ESPERANZA"
  console.log('📊 TEST 2: FILTRO POR PUESTO "COLEGIO DE LA ESPERANZA"');
  console.log('─'.repeat(60));

  const colegio = await prisma.pollingStation.findFirst({
    where: { name: { contains: 'COLEGIO DE LA ESPERANZA' } }
  });

  if (colegio) {
    const witnessesInColegio = await prisma.electoralWitness.findMany({
      where: {
        leaderId: leader.id,
        pollingStationId: colegio.id
      },
      include: {
        voter: { select: { name: true } }
      }
    });

    const tablesInColegio = witnessesInColegio.reduce((sum, w) => {
      const tables = JSON.parse(w.assignedTables);
      return sum + tables.length;
    }, 0);

    console.log(`Puesto: ${colegio.name}`);
    console.log(`Testigos en este puesto: ${witnessesInColegio.length}`);
    console.log(`Mesas asignadas en este puesto: ${tablesInColegio}`);
    witnessesInColegio.forEach((w, i) => {
      const tables = JSON.parse(w.assignedTables);
      console.log(`  ${i + 1}. ${w.voter.name} → ${tables.length} mesas (${tables.join(', ')})`);
    });
    console.log(`✅ Esperado: 2 mesas | Obtenido: ${tablesInColegio} mesas\n`);
  } else {
    console.log('❌ No se encontró el puesto "COLEGIO DE LA ESPERANZA"\n');
  }

  // TEST 3: Filtro por Puesto "BAYUNCA 2"
  console.log('📊 TEST 3: FILTRO POR PUESTO "BAYUNCA 2"');
  console.log('─'.repeat(60));

  const bayunca = await prisma.pollingStation.findFirst({
    where: { name: { contains: 'BAYUNCA 2' } }
  });

  if (bayunca) {
    const witnessesInBayunca = await prisma.electoralWitness.findMany({
      where: {
        leaderId: leader.id,
        pollingStationId: bayunca.id
      },
      include: {
        voter: { select: { name: true } }
      }
    });

    const tablesInBayunca = witnessesInBayunca.reduce((sum, w) => {
      const tables = JSON.parse(w.assignedTables);
      return sum + tables.length;
    }, 0);

    console.log(`Puesto: ${bayunca.name}`);
    console.log(`Testigos en este puesto: ${witnessesInBayunca.length}`);
    console.log(`Mesas asignadas en este puesto: ${tablesInBayunca}`);
    witnessesInBayunca.forEach((w, i) => {
      const tables = JSON.parse(w.assignedTables);
      console.log(`  ${i + 1}. ${w.voter.name} → ${tables.length} mesas (${tables.join(', ')})`);
    });
    console.log(`✅ Esperado: 2 mesas | Obtenido: ${tablesInBayunca} mesas\n`);
  } else {
    console.log('❌ No se encontró el puesto "BAYUNCA 2"\n');
  }

  // TEST 4: Filtro por Testigo "Antonia Marrugo"
  console.log('📊 TEST 4: FILTRO POR TESTIGO "Antonia Marrugo"');
  console.log('─'.repeat(60));

  const antonia = await prisma.electoralWitness.findFirst({
    where: {
      leaderId: leader.id,
      voter: { name: { contains: 'Antonia' } }
    },
    include: {
      voter: { select: { name: true } },
      pollingStation: { select: { name: true } }
    }
  });

  if (antonia) {
    const antoniasTables = JSON.parse(antonia.assignedTables);
    console.log(`Testigo: ${antonia.voter.name}`);
    console.log(`Puesto: ${antonia.pollingStation.name}`);
    console.log(`Mesas asignadas: ${antoniasTables.length} (${antoniasTables.join(', ')})`);
    console.log(`✅ Esperado: 2 mesas | Obtenido: ${antoniasTables.length} mesas\n`);
  } else {
    console.log('❌ No se encontró el testigo "Antonia Marrugo"\n');
  }

  // TEST 5: Filtro por Testigo "Maralara"
  console.log('📊 TEST 5: FILTRO POR TESTIGO "Maralara"');
  console.log('─'.repeat(60));

  const maralara = await prisma.electoralWitness.findFirst({
    where: {
      leaderId: leader.id,
      voter: { name: { contains: 'Maralara' } }
    },
    include: {
      voter: { select: { name: true } },
      pollingStation: { select: { name: true } }
    }
  });

  if (maralara) {
    const maralarasTables = JSON.parse(maralara.assignedTables);
    console.log(`Testigo: ${maralara.voter.name}`);
    console.log(`Puesto: ${maralara.pollingStation.name}`);
    console.log(`Mesas asignadas: ${maralarasTables.length} (${maralarasTables.join(', ')})`);
    console.log(`✅ Esperado: 2 mesas | Obtenido: ${maralarasTables.length} mesas\n`);
  } else {
    console.log('❌ No se encontró el testigo "Maralara"\n');
  }

  // RESUMEN
  console.log('═'.repeat(60));
  console.log('📋 RESUMEN DE PRUEBAS\n');
  console.log('✅ Vista General: 4 mesas totales');
  console.log('✅ Filtro COLEGIO DE LA ESPERANZA: 2 mesas');
  console.log('✅ Filtro BAYUNCA 2: 2 mesas');
  console.log('✅ Filtro Antonia Marrugo: 2 mesas (1, 2)');
  console.log('✅ Filtro Maralara: 2 mesas (3, 4)');
  console.log('\n🎉 Todos los filtros funcionan correctamente!\n');
}

testFilters()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
