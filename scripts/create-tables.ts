/**
 * Script para crear las mesas electorales
 * Crea mesas numeradas para cada puesto de votación según su totalTables
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗳️  Iniciando creación de mesas electorales...\n');
  
  // Obtener todos los puestos de votación
  const pollingStations = await prisma.pollingStation.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      totalTables: true,
      municipality: {
        select: {
          name: true
        }
      }
    }
  });
  
  console.log(`📊 Encontrados ${pollingStations.length} puestos de votación\n`);
  
  let totalTablesCreated = 0;
  let stationsProcessed = 0;
  
  for (const station of pollingStations) {
    if (station.totalTables === 0) {
      console.log(`⚠️  ${station.name} - Sin mesas definidas, saltando...`);
      continue;
    }
    
    // Verificar si ya existen mesas para este puesto
    const existingTables = await prisma.table.count({
      where: { pollingStationId: station.id }
    });
    
    if (existingTables > 0) {
      console.log(`✓ ${station.name} - Ya tiene ${existingTables} mesas`);
      totalTablesCreated += existingTables;
      stationsProcessed++;
      continue;
    }
    
    // Crear mesas para este puesto
    const tables = [];
    for (let i = 1; i <= station.totalTables; i++) {
      tables.push({
        number: i,
        pollingStationId: station.id
      });
    }
    
    // Insertar todas las mesas de este puesto
    await prisma.table.createMany({
      data: tables,
      skipDuplicates: true
    });
    
    totalTablesCreated += tables.length;
    stationsProcessed++;
    
    console.log(`✅ ${station.municipality.name} - ${station.name}: ${tables.length} mesas creadas`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN\n');
  console.log(`✅ Puestos procesados: ${stationsProcessed}`);
  console.log(`✅ Total de mesas creadas: ${totalTablesCreated}`);
  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 Proceso completado exitosamente!\n');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
