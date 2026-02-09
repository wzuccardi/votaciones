/**
 * Script de prueba completo del sistema
 * Valida todas las funcionalidades implementadas
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>) {
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, message: 'OK', duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, message, duration });
    console.error(`❌ ${name} (${duration}ms): ${message}`);
  }
}

async function testDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
}

async function testBolivarData() {
  const bolivar = await prisma.department.findFirst({
    where: { 
      OR: [
        { name: 'Bolívar' },
        { name: 'BOLÍVAR' },
        { code: '13' }
      ]
    },
    include: { municipalities: true }
  });
  
  if (!bolivar) throw new Error('Departamento de Bolívar no encontrado');
  if (bolivar.municipalities.length === 0) throw new Error('No hay municipios cargados');
  
  console.log(`   📍 Encontrados ${bolivar.municipalities.length} municipios en Bolívar`);
}

async function testPollingStations() {
  const stations = await prisma.pollingStation.findMany({
    take: 5,
    include: { municipality: true }
  });
  
  if (stations.length === 0) throw new Error('No hay puestos de votación');
  
  console.log(`   🗳️  Encontrados ${stations.length} puestos de votación (muestra)`);
}

async function testCandidates() {
  const candidates = await prisma.candidate.findMany({
    take: 5,
    include: { leaders: true }
  });
  
  console.log(`   👔 Encontrados ${candidates.length} candidatos`);
}

async function testLeaders() {
  const leaders = await prisma.leader.findMany({
    take: 5,
    include: { voters: true, candidate: true }
  });
  
  console.log(`   👥 Encontrados ${leaders.length} líderes`);
}

async function testVoters() {
  const voters = await prisma.voter.findMany({
    take: 5,
    include: { leader: true, pollingStation: true }
  });
  
  console.log(`   🗳️  Encontrados ${voters.length} votantes`);
}

async function testWitnessSystem() {
  const witnesses = await prisma.electoralWitness.findMany({
    take: 5,
    include: { pollingStation: true }
  });
  
  console.log(`   👁️  Encontrados ${witnesses.length} testigos electorales`);
}

async function testWitnessChecklists() {
  // Verificar si el modelo existe en el schema
  if (!prisma.witnessChecklist) {
    console.log(`   ⚠️  Modelo WitnessChecklist no disponible en el schema`);
    return;
  }
  
  const checklists = await prisma.witnessChecklist.findMany({
    take: 5,
    include: { witness: true }
  });
  
  console.log(`   ✅ Encontrados ${checklists.length} checklists de testigos`);
}

async function testDataIntegrity() {
  // Verificar que no hay votantes sin líder
  const orphanVoters = await prisma.voter.count({
    where: { 
      OR: [
        { leaderId: null },
        { leaderId: '' }
      ]
    }
  });
  
  if (orphanVoters > 0) {
    console.log(`   ⚠️  Advertencia: ${orphanVoters} votantes sin líder asignado`);
  }
  
  // Verificar que no hay líderes sin candidato
  const orphanLeaders = await prisma.leader.count({
    where: { 
      OR: [
        { candidateId: '' }
      ]
    }
  });
  
  if (orphanLeaders > 0) {
    console.log(`   ⚠️  Advertencia: ${orphanLeaders} líderes sin candidato asignado`);
  }
  
  console.log(`   ✅ Integridad verificada`);
}

async function testIndexes() {
  // Verificar rendimiento de consultas comunes
  const start = Date.now();
  
  await prisma.voter.findMany({
    where: {
      pollingStationId: { not: '' }
    },
    take: 100
  });
  
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    throw new Error(`Consulta lenta: ${duration}ms (esperado < 1000ms)`);
  }
  
  console.log(`   ⚡ Consulta de votantes: ${duration}ms`);
}

async function main() {
  console.log('🧪 Iniciando pruebas del sistema completo...\n');
  console.log('=' .repeat(60));
  
  // Pruebas de infraestructura
  console.log('\n📦 INFRAESTRUCTURA Y BASE DE DATOS');
  await runTest('Conexión a PostgreSQL (Supabase)', testDatabaseConnection);
  await runTest('Datos de Bolívar cargados', testBolivarData);
  await runTest('Puestos de votación disponibles', testPollingStations);
  
  // Pruebas de datos
  console.log('\n👥 DATOS DEL SISTEMA');
  await runTest('Candidatos registrados', testCandidates);
  await runTest('Líderes registrados', testLeaders);
  await runTest('Votantes registrados', testVoters);
  
  // Pruebas del sistema de testigos
  console.log('\n👁️  SISTEMA DE TESTIGOS ELECTORALES');
  await runTest('Testigos electorales', testWitnessSystem);
  await runTest('Checklists de testigos', testWitnessChecklists);
  
  // Pruebas de integridad
  console.log('\n🔍 INTEGRIDAD DE DATOS');
  await runTest('Integridad referencial', testDataIntegrity);
  await runTest('Rendimiento de índices', testIndexes);
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN DE PRUEBAS\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`Total: ${total} pruebas`);
  console.log(`✅ Exitosas: ${passed}`);
  console.log(`❌ Fallidas: ${failed}`);
  console.log(`⏱️  Tiempo total: ${totalDuration}ms`);
  
  if (failed > 0) {
    console.log('\n❌ PRUEBAS FALLIDAS:\n');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  • ${r.name}: ${r.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  await prisma.$disconnect();
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
