import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Código DANE del departamento de Bolívar
const BOLIVAR_CODE = '13'

interface CleanupReport {
  before: {
    departments: number
    municipalities: number
    pollingStations: number
    voters: number
    totalSize: string
  }
  after: {
    departments: number
    municipalities: number
    pollingStations: number
    voters: number
    totalSize: string
  }
  deleted: {
    departments: number
    municipalities: number
    pollingStations: number
  }
  bolivar: {
    id: string
    name: string
    code: string
  }
}

async function cleanupDatabaseBolivar(): Promise<CleanupReport> {
  console.log('🧹 Iniciando limpieza - Solo Departamento de Bolívar...\n')
  
  // 1. Crear backup
  console.log('📦 Creando backup...')
  await createBackup()
  
  // 2. Obtener estadísticas iniciales
  const before = await getStats()
  console.log('📊 Estado inicial:')
  console.log(`  - Departamentos: ${before.departments}`)
  console.log(`  - Municipios: ${before.municipalities}`)
  console.log(`  - Puestos de votación: ${before.pollingStations}`)
  console.log(`  - Votantes: ${before.voters}`)
  console.log(`  - Tamaño: ${before.totalSize}`)
  
  // 3. Obtener ID del departamento de Bolívar
  const bolivar = await prisma.department.findUnique({
    where: { code: BOLIVAR_CODE }
  })
  
  if (!bolivar) {
    throw new Error('❌ Departamento de Bolívar no encontrado en la base de datos')
  }
  
  console.log(`\n🎯 Departamento de Bolívar encontrado:`)
  console.log(`  - Nombre: ${bolivar.name}`)
  console.log(`  - Código: ${bolivar.code}`)
  console.log(`  - ID: ${bolivar.id}`)
  
  // 4. Eliminar puestos de votación de otros departamentos
  console.log('\n🗑️  Eliminando puestos de votación de otros departamentos...')
  const deletedPollingStations = await prisma.pollingStation.deleteMany({
    where: {
      municipality: {
        departmentId: { not: bolivar.id }
      }
    }
  })
  console.log(`  ✓ Eliminados: ${deletedPollingStations.count} puestos`)
  
  // 5. Eliminar municipios de otros departamentos
  console.log('\n🗑️  Eliminando municipios de otros departamentos...')
  const deletedMunicipalities = await prisma.municipality.deleteMany({
    where: {
      departmentId: { not: bolivar.id }
    }
  })
  console.log(`  ✓ Eliminados: ${deletedMunicipalities.count} municipios`)
  
  // 6. Eliminar otros departamentos
  console.log('\n🗑️  Eliminando otros departamentos...')
  const deletedDepartments = await prisma.department.deleteMany({
    where: {
      id: { not: bolivar.id }
    }
  })
  console.log(`  ✓ Eliminados: ${deletedDepartments.count} departamentos`)
  
  // 7. Obtener estadísticas finales
  const after = await getStats()
  console.log('\n📊 Estado final:')
  console.log(`  - Departamentos: ${after.departments}`)
  console.log(`  - Municipios: ${after.municipalities}`)
  console.log(`  - Puestos de votación: ${after.pollingStations}`)
  console.log(`  - Votantes: ${after.voters}`)
  console.log(`  - Tamaño: ${after.totalSize}`)
  
  // 8. Ejecutar VACUUM para reducir tamaño del archivo
  console.log('\n🔧 Ejecutando VACUUM para reducir tamaño...')
  await prisma.$executeRawUnsafe('VACUUM')
  
  // 9. Obtener tamaño final después de VACUUM
  const finalStats = await getStats()
  console.log(`  ✓ Tamaño después de VACUUM: ${finalStats.totalSize}`)
  
  const report: CleanupReport = {
    before,
    after: finalStats,
    deleted: {
      departments: deletedDepartments.count,
      municipalities: deletedMunicipalities.count,
      pollingStations: deletedPollingStations.count
    },
    bolivar: {
      id: bolivar.id,
      name: bolivar.name,
      code: bolivar.code
    }
  }
  
  // 10. Guardar reporte
  const reportPath = 'cleanup-report-bolivar.json'
  fs.writeFileSync(
    reportPath,
    JSON.stringify(report, null, 2)
  )
  
  console.log('\n✅ Limpieza completada exitosamente!')
  console.log(`📄 Reporte guardado en: ${reportPath}`)
  console.log(`\n📍 La aplicación ahora trabaja SOLO con el departamento de Bolívar`)
  console.log(`📉 Reducción de tamaño: ${before.totalSize} → ${finalStats.totalSize}`)
  console.log(`📉 Reducción de registros: ${before.departments + before.municipalities + before.pollingStations} → ${finalStats.departments + finalStats.municipalities + finalStats.pollingStations}`)
  
  return report
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = 'prisma/backups'
  const backupPath = path.join(backupDir, `dev-${timestamp}.db`)
  
  // Crear carpeta de backups si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  // Copiar archivo de base de datos
  const dbPath = 'prisma/dev.db'
  if (!fs.existsSync(dbPath)) {
    throw new Error(`❌ Base de datos no encontrada en: ${dbPath}`)
  }
  
  fs.copyFileSync(dbPath, backupPath)
  console.log(`  ✓ Backup creado: ${backupPath}`)
}

async function getStats() {
  const [departments, municipalities, pollingStations, voters] = await Promise.all([
    prisma.department.count(),
    prisma.municipality.count(),
    prisma.pollingStation.count(),
    prisma.voter.count()
  ])
  
  // Obtener tamaño del archivo
  const dbPath = 'prisma/dev.db'
  const stats = fs.statSync(dbPath)
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
  const sizeKB = (stats.size / 1024).toFixed(2)
  
  return {
    departments,
    municipalities,
    pollingStations,
    voters,
    totalSize: stats.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`
  }
}

// Ejecutar limpieza
cleanupDatabaseBolivar()
  .then(() => {
    console.log('\n🎉 Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error durante la limpieza:', error.message)
    console.error('\n⚠️  La base de datos NO fue modificada (se creó backup)')
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
