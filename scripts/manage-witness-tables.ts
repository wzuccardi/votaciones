/**
 * Script para gestionar y reasignar mesas a testigos electorales
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function listWitnesses() {
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
          name: true,
          totalTables: true
        }
      }
    }
  });

  console.log('\n📋 TESTIGOS ELECTORALES REGISTRADOS:\n');
  
  if (witnesses.length === 0) {
    console.log('❌ No hay testigos registrados\n');
    return [];
  }

  witnesses.forEach((witness, index) => {
    const tables = JSON.parse(witness.assignedTables);
    console.log(`${index + 1}. ${witness.voter.name} (${witness.voter.document})`);
    console.log(`   ID: ${witness.id}`);
    console.log(`   Puesto: ${witness.pollingStation.name}`);
    console.log(`   Mesas asignadas: ${tables.join(', ')} (${tables.length} mesas)`);
    console.log(`   Total mesas en puesto: ${witness.pollingStation.totalTables}`);
    console.log('');
  });

  return witnesses;
}

async function reassignTables(witnessId: string, newTables: number[]) {
  try {
    const updated = await prisma.electoralWitness.update({
      where: { id: witnessId },
      data: {
        assignedTables: JSON.stringify(newTables)
      },
      include: {
        voter: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`\n✅ Mesas actualizadas para ${updated.voter.name}`);
    console.log(`   Nuevas mesas: ${newTables.join(', ')}`);
  } catch (error) {
    console.error('❌ Error al actualizar:', error);
  }
}

async function main() {
  console.log('🔧 GESTOR DE MESAS PARA TESTIGOS ELECTORALES\n');
  console.log('═'.repeat(50));

  const witnesses = await listWitnesses();
  
  if (witnesses.length === 0) {
    rl.close();
    return;
  }

  console.log('═'.repeat(50));
  console.log('\nOPCIONES:');
  console.log('1. Ver resumen de asignaciones');
  console.log('2. Reasignar mesas a un testigo');
  console.log('3. Salir');
  console.log('');

  const option = await question('Seleccione una opción (1-3): ');

  switch (option.trim()) {
    case '1':
      // Mostrar resumen
      const totalTables = witnesses.reduce((sum, w) => {
        const tables = JSON.parse(w.assignedTables);
        return sum + tables.length;
      }, 0);
      
      console.log('\n📊 RESUMEN DE ASIGNACIONES:');
      console.log(`   Total testigos: ${witnesses.length}`);
      console.log(`   Total mesas asignadas: ${totalTables}`);
      console.log(`   Promedio mesas por testigo: ${(totalTables / witnesses.length).toFixed(1)}`);
      break;

    case '2':
      // Reasignar mesas
      const witnessNum = await question('\nNúmero del testigo a modificar: ');
      const witnessIndex = parseInt(witnessNum) - 1;
      
      if (witnessIndex < 0 || witnessIndex >= witnesses.length) {
        console.log('❌ Número de testigo inválido');
        break;
      }

      const selectedWitness = witnesses[witnessIndex];
      const currentTables = JSON.parse(selectedWitness.assignedTables);
      
      console.log(`\nTestigo seleccionado: ${selectedWitness.voter.name}`);
      console.log(`Mesas actuales: ${currentTables.join(', ')}`);
      console.log(`Total mesas disponibles en puesto: ${selectedWitness.pollingStation.totalTables}`);
      
      const newTablesInput = await question('\nIngrese las nuevas mesas (separadas por coma, ej: 1,2,3,4): ');
      const newTables = newTablesInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      
      if (newTables.length === 0) {
        console.log('❌ Debe ingresar al menos una mesa');
        break;
      }

      if (newTables.length > 5) {
        console.log('❌ Máximo 5 mesas por testigo');
        break;
      }

      // Validar que las mesas existan en el puesto
      const maxTable = selectedWitness.pollingStation.totalTables;
      const invalidTables = newTables.filter(t => t < 1 || t > maxTable);
      
      if (invalidTables.length > 0) {
        console.log(`❌ Mesas inválidas: ${invalidTables.join(', ')}`);
        console.log(`   Las mesas deben estar entre 1 y ${maxTable}`);
        break;
      }

      const confirm = await question(`\n¿Confirmar cambio de [${currentTables.join(', ')}] a [${newTables.join(', ')}]? (s/n): `);
      
      if (confirm.toLowerCase() === 's') {
        await reassignTables(selectedWitness.id, newTables);
      } else {
        console.log('❌ Operación cancelada');
      }
      break;

    case '3':
      console.log('\n👋 Saliendo...');
      break;

    default:
      console.log('❌ Opción inválida');
  }

  rl.close();
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
