/**
 * Script para importar datos completos del DIVIPOLE Nacional
 * Importa departamentos, municipios y puestos de votación con todas sus zonas
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CSVRow {
  departamento: string;
  municipio: string;
  puesto: string;
  mujeres: number;
  hombres: number;
  total: number;
  mesas: number;
  comuna: string;
  direccion: string;
}

function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Saltar el header
  const dataLines = lines.slice(1);
  
  const rows: CSVRow[] = [];
  
  for (const line of dataLines) {
    const parts = line.split(';');
    
    if (parts.length < 9) continue;
    
    rows.push({
      departamento: parts[0].trim(),
      municipio: parts[1].trim(),
      puesto: parts[2].trim(),
      mujeres: parseInt(parts[3].replace(/\./g, '')) || 0,
      hombres: parseInt(parts[4].replace(/\./g, '')) || 0,
      total: parseInt(parts[5].replace(/\./g, '')) || 0,
      mesas: parseInt(parts[6]) || 0,
      comuna: parts[7].trim(),
      direccion: parts[8].trim()
    });
  }
  
  return rows;
}

async function main() {
  console.log('🚀 Iniciando importación completa del DIVIPOLE Nacional...\n');
  
  const csvPath = path.join(process.cwd(), 'Genio', 'DIVIPOLE NACIONALPiolo.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Archivo CSV no encontrado:', csvPath);
    process.exit(1);
  }
  
  console.log('📂 Leyendo archivo CSV...');
  const rows = parseCSV(csvPath);
  console.log(`✅ ${rows.length} registros leídos\n`);
  
  // Agrupar por departamento
  const departmentMap = new Map<string, Map<string, CSVRow[]>>();
  
  for (const row of rows) {
    if (!departmentMap.has(row.departamento)) {
      departmentMap.set(row.departamento, new Map());
    }
    
    const municipalityMap = departmentMap.get(row.departamento)!;
    
    if (!municipalityMap.has(row.municipio)) {
      municipalityMap.set(row.municipio, []);
    }
    
    municipalityMap.get(row.municipio)!.push(row);
  }
  
  console.log(`📊 Encontrados ${departmentMap.size} departamentos\n`);
  
  let totalDepartments = 0;
  let totalMunicipalities = 0;
  let totalPollingStations = 0;
  let totalVoters = 0;
  
  // Procesar cada departamento
  for (const [deptName, municipalityMap] of departmentMap.entries()) {
    console.log(`\n📍 Procesando departamento: ${deptName}`);
    
    // Obtener código DANE del departamento (primeros 2 dígitos del código del municipio)
    const firstMunicipality = Array.from(municipalityMap.values())[0][0];
    const deptCode = getDepartmentCode(deptName);
    
    // Crear o actualizar departamento
    const department = await prisma.department.upsert({
      where: { code: deptCode },
      update: { name: deptName },
      create: {
        name: deptName,
        code: deptCode
      }
    });
    
    totalDepartments++;
    console.log(`   ✅ Departamento: ${deptName} (${deptCode})`);
    
    // Procesar municipios
    let deptMunicipalities = 0;
    let deptPollingStations = 0;
    
    for (const [muniName, pollingStations] of municipalityMap.entries()) {
      const muniCode = getMunicipalityCode(deptCode, muniName);
      
      // Crear o actualizar municipio
      const municipality = await prisma.municipality.upsert({
        where: { code: muniCode },
        update: { name: muniName },
        create: {
          name: muniName,
          code: muniCode,
          departmentId: department.id
        }
      });
      
      deptMunicipalities++;
      totalMunicipalities++;
      
      // Procesar puestos de votación
      for (const ps of pollingStations) {
        const psCode = generatePollingStationCode(muniCode, ps.puesto);
        
        await prisma.pollingStation.upsert({
          where: { id: psCode },
          update: {
            name: ps.puesto,
            code: psCode,
            address: ps.direccion,
            community: ps.comuna,
            totalVoters: ps.total,
            maleVoters: ps.hombres,
            femaleVoters: ps.mujeres,
            totalTables: ps.mesas,
            municipalityId: municipality.id
          },
          create: {
            id: psCode,
            name: ps.puesto,
            code: psCode,
            address: ps.direccion,
            community: ps.comuna,
            totalVoters: ps.total,
            maleVoters: ps.hombres,
            femaleVoters: ps.mujeres,
            totalTables: ps.mesas,
            municipalityId: municipality.id,
            senado: true,
            camara: true
          }
        });
        
        deptPollingStations++;
        totalPollingStations++;
        totalVoters += ps.total;
      }
      
      console.log(`      ✓ ${muniName}: ${pollingStations.length} puestos`);
    }
    
    console.log(`   📊 ${deptMunicipalities} municipios, ${deptPollingStations} puestos`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN DE IMPORTACIÓN\n');
  console.log(`✅ Departamentos: ${totalDepartments}`);
  console.log(`✅ Municipios: ${totalMunicipalities}`);
  console.log(`✅ Puestos de votación: ${totalPollingStations}`);
  console.log(`✅ Total votantes: ${totalVoters.toLocaleString()}`);
  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 Importación completada exitosamente!\n');
}

// Función para obtener código DANE del departamento
function getDepartmentCode(deptName: string): string {
  const codes: Record<string, string> = {
    'AMAZONAS': '91',
    'ANTIOQUIA': '05',
    'ARAUCA': '81',
    'ATLANTICO': '08',
    'BOLIVAR': '13',
    'BOYACA': '15',
    'CALDAS': '17',
    'CAQUETA': '18',
    'CASANARE': '85',
    'CAUCA': '19',
    'CESAR': '20',
    'CHOCO': '27',
    'CORDOBA': '23',
    'CUNDINAMARCA': '25',
    'GUAINIA': '94',
    'GUAVIARE': '95',
    'HUILA': '41',
    'LA GUAJIRA': '44',
    'MAGDALENA': '47',
    'META': '50',
    'NARIÑO': '52',
    'NORTE DE SANTANDER': '54',
    'PUTUMAYO': '86',
    'QUINDIO': '63',
    'RISARALDA': '66',
    'SAN ANDRES': '88',
    'SANTANDER': '68',
    'SUCRE': '70',
    'TOLIMA': '73',
    'VALLE DEL CAUCA': '76',
    'VAUPES': '97',
    'VICHADA': '99',
    'BOGOTA': '11'
  };
  
  return codes[deptName.toUpperCase()] || '00';
}

// Función para obtener código DANE del municipio
function getMunicipalityCode(deptCode: string, muniName: string): string {
  // Para Bolívar, usar códigos conocidos
  if (deptCode === '13') {
    const bolivarCodes: Record<string, string> = {
      'CARTAGENA': '13001',
      'MAGANGUE': '13430',
      'TURBACO': '13836',
      'ARJONA': '13052',
      'EL CARMEN DE BOLIVAR': '13244',
      'TURBANA': '13838',
      'MAHATES': '13433',
      'MARIA LA BAJA': '13442',
      'SANTA ROSA': '13683',
      'VILLANUEVA': '13873',
      'ACHI': '13006',
      'ALTOS DEL ROSARIO': '13030',
      'ARENAL': '13042',
      'BARRANCO DE LOBA': '13062',
      'CALAMAR': '13140',
      'CANTAGALLO': '13160',
      'CICUCO': '13188',
      'CLEMENCIA': '13222',
      'CORDOBA': '13212',
      'EL GUAMO': '13248',
      'EL PEÑON': '13268',
      'HATILLO DE LOBA': '13300',
      'MARGARITA': '13440',
      'MOMPOS': '13468',
      'MONTECRISTO': '13458',
      'MORALES': '13473',
      'NOROSI': '13490',
      'PINILLOS': '13549',
      'REGIDOR': '13580',
      'RIO VIEJO': '13600',
      'SAN CRISTOBAL': '13620',
      'SAN ESTANISLAO': '13647',
      'SAN FERNANDO': '13650',
      'SAN JACINTO': '13654',
      'SAN JACINTO DEL CAUCA': '13655',
      'SAN JUAN NEPOMUCENO': '13657',
      'SAN MARTIN DE LOBA': '13667',
      'SAN PABLO': '13670',
      'SANTA CATALINA': '13673',
      'SANTA ROSA DEL SUR': '13688',
      'SIMITI': '13744',
      'SOPLAVIENTO': '13760',
      'TALAIGUA NUEVO': '13780',
      'TIQUISIO': '13810',
      'ZAMBRANO': '13894'
    };
    
    return bolivarCodes[muniName.toUpperCase()] || `${deptCode}999`;
  }
  
  // Para otros departamentos, generar código secuencial
  return `${deptCode}${Math.floor(Math.random() * 900 + 100)}`;
}

// Función para generar código único del puesto de votación
function generatePollingStationCode(muniCode: string, psName: string): string {
  // Crear un hash simple del nombre del puesto
  let hash = 0;
  for (let i = 0; i < psName.length; i++) {
    hash = ((hash << 5) - hash) + psName.charCodeAt(i);
    hash = hash & hash;
  }
  
  const hashStr = Math.abs(hash).toString().substring(0, 6).padStart(6, '0');
  return `PS-${muniCode}-${hashStr}`;
}

main()
  .catch((error) => {
    console.error('❌ Error durante la importación:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
