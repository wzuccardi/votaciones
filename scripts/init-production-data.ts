#!/usr/bin/env ts-node

/**
 * Script para inicializar datos en producción
 * Carga los datos básicos necesarios para el funcionamiento de la aplicación
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando carga de datos de producción...')

  try {
    // 1. Verificar conexión a la base de datos
    console.log('📡 Verificando conexión a la base de datos...')
    await prisma.$connect()
    console.log('✅ Conexión exitosa a la base de datos')

    // 2. Cargar datos de DIVIPOLE Nacional
    console.log('📊 Cargando datos de DIVIPOLE Nacional...')
    await loadDivipoleData()

    // 3. Cargar datos específicos de Bolívar
    console.log('🏛️ Cargando datos específicos de Bolívar...')
    await loadBolivarData()

    // 4. Verificar datos cargados
    console.log('🔍 Verificando datos cargados...')
    await verifyData()

    console.log('✅ ¡Datos de producción cargados exitosamente!')

  } catch (error) {
    console.error('❌ Error cargando datos:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function loadDivipoleData() {
  const csvPath = path.join(process.cwd(), 'Genio', 'DIVIPOLE NACIONALPiolo.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Archivo DIVIPOLE no encontrado, saltando...')
    return
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ';'
  })

  console.log(`📄 Procesando ${records.length} registros de DIVIPOLE...`)

  let processedCount = 0
  const batchSize = 100

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    
    for (const record of batch) {
      try {
        // Crear o actualizar departamento
        const department = await prisma.department.upsert({
          where: { code: record.CODIGO_DEPARTAMENTO },
          update: { name: record.DEPARTAMENTO },
          create: {
            code: record.CODIGO_DEPARTAMENTO,
            name: record.DEPARTAMENTO
          }
        })

        // Crear o actualizar municipio
        await prisma.municipality.upsert({
          where: { code: record.CODIGO_MUNICIPIO },
          update: { 
            name: record.MUNICIPIO,
            departmentId: department.id
          },
          create: {
            code: record.CODIGO_MUNICIPIO,
            name: record.MUNICIPIO,
            departmentId: department.id
          }
        })

        processedCount++
      } catch (error) {
        console.error(`Error procesando registro ${record.CODIGO_MUNICIPIO}:`, error)
      }
    }

    console.log(`📈 Procesados ${Math.min(i + batchSize, records.length)} de ${records.length} registros`)
  }

  console.log(`✅ DIVIPOLE cargado: ${processedCount} registros procesados`)
}

async function loadBolivarData() {
  const csvPath = path.join(process.cwd(), 'upload', 'Divipole_Elecciones_Territoritoriales_2023_con_georreferenciación_20260119.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Archivo de Bolívar no encontrado, saltando...')
    return
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ','
  })

  console.log(`📄 Procesando ${records.length} registros de Bolívar...`)

  let processedCount = 0
  const batchSize = 50

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    
    for (const record of batch) {
      try {
        // Buscar el municipio
        const municipality = await prisma.municipality.findFirst({
          where: { name: { contains: record.MUNICIPIO, mode: 'insensitive' } }
        })

        if (!municipality) {
          console.log(`⚠️ Municipio no encontrado: ${record.MUNICIPIO}`)
          continue
        }

        // Crear puesto de votación
        await prisma.pollingStation.upsert({
          where: { 
            code: `${record.CODIGO_PUESTO || record.COD_PUESTO || 'SIN_CODIGO'}_${municipality.id}`
          },
          update: {
            name: record.PUESTO || record.NOMBRE_PUESTO || 'Sin nombre',
            address: record.DIRECCION || record.DIRECCIÓN || null,
            municipalityId: municipality.id
          },
          create: {
            code: `${record.CODIGO_PUESTO || record.COD_PUESTO || 'SIN_CODIGO'}_${municipality.id}`,
            name: record.PUESTO || record.NOMBRE_PUESTO || 'Sin nombre',
            address: record.DIRECCION || record.DIRECCIÓN || null,
            municipalityId: municipality.id
          }
        })

        processedCount++
      } catch (error) {
        console.error(`Error procesando puesto ${record.PUESTO}:`, error)
      }
    }

    console.log(`📈 Procesados ${Math.min(i + batchSize, records.length)} de ${records.length} registros`)
  }

  console.log(`✅ Datos de Bolívar cargados: ${processedCount} registros procesados`)
}

async function verifyData() {
  const departmentCount = await prisma.department.count()
  const municipalityCount = await prisma.municipality.count()
  const pollingStationCount = await prisma.pollingStation.count()

  console.log(`📊 Resumen de datos cargados:`)
  console.log(`   - Departamentos: ${departmentCount}`)
  console.log(`   - Municipios: ${municipalityCount}`)
  console.log(`   - Puestos de votación: ${pollingStationCount}`)

  if (departmentCount === 0 || municipalityCount === 0) {
    throw new Error('No se cargaron datos básicos correctamente')
  }
}

// Ejecutar script
main().catch(console.error)