import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function fixMunicipalitiesAndStations() {
  console.log('🔧 CORRIGIENDO MUNICIPIOS Y PUESTOS DE VOTACIÓN\n')
  
  try {
    // 1. Eliminar puestos "COLEGIO PRINCIPAL" (datos de prueba)
    console.log('🗑️  Paso 1: Eliminando puestos de prueba...')
    
    const testStations = await prisma.pollingStation.findMany({
      where: {
        name: {
          contains: 'COLEGIO PRINCIPAL'
        }
      }
    })
    
    console.log(`   Encontrados ${testStations.length} puestos de prueba`)
    
    for (const station of testStations) {
      // Eliminar mesas asociadas
      await prisma.table.deleteMany({
        where: { pollingStationId: station.id }
      })
      
      // Eliminar puesto
      await prisma.pollingStation.delete({
        where: { id: station.id }
      })
    }
    
    console.log(`   ✅ Eliminados ${testStations.length} puestos de prueba\n`)
    
    // 2. Eliminar puestos mal asignados de TIQUISIO
    console.log('🗑️  Paso 2: Eliminando puestos mal asignados a TIQUISIO...')
    
    const wrongStations = [
      'MACHADO', 'MONROY', 'PILON', 'SATO', 'SAN FRANCISCO',
      'PUESTO CABECERA MUNICIPAL', 'CAMPO ALEGRE', 'COBADILLO',
      'CAIMITAL', 'HATILLO', 'BLANCAS PALOMAS', 'MACEDONIA'
    ]
    
    const tiquisio = await prisma.municipality.findFirst({
      where: { name: 'TIQUISIO (PTO. RICO)' }
    })
    
    if (tiquisio) {
      const wrongTiquisioStations = await prisma.pollingStation.findMany({
        where: {
          municipalityId: tiquisio.id,
          name: { in: wrongStations }
        }
      })
      
      console.log(`   Encontrados ${wrongTiquisioStations.length} puestos mal asignados`)
      
      for (const station of wrongTiquisioStations) {
        await prisma.table.deleteMany({
          where: { pollingStationId: station.id }
        })
        
        await prisma.pollingStation.delete({
          where: { id: station.id }
        })
      }
      
      console.log(`   ✅ Eliminados ${wrongTiquisioStations.length} puestos mal asignados\n`)
    }
    
    // 3. Crear municipios faltantes
    console.log('🏘️  Paso 3: Creando municipios faltantes...')
    
    const bolivar = await prisma.department.findFirst({
      where: { code: '13' }
    })
    
    if (!bolivar) {
      throw new Error('Departamento de Bolívar no encontrado')
    }
    
    const missingMunicipalities = ['ARROYO HONDO', 'RIOVIEJO']
    const createdMunicipalities = new Map<string, string>()
    
    for (const municipioName of missingMunicipalities) {
      const existing = await prisma.municipality.findFirst({
        where: {
          name: municipioName,
          departmentId: bolivar.id
        }
      })
      
      if (!existing) {
        const count = await prisma.municipality.count({
          where: { departmentId: bolivar.id }
        })
        
        const municipioCode = `13${String(count + 1).padStart(3, '0')}`
        
        const municipality = await prisma.municipality.create({
          data: {
            name: municipioName,
            code: municipioCode,
            departmentId: bolivar.id
          }
        })
        
        createdMunicipalities.set(municipioName, municipality.id)
        console.log(`   ✅ Creado: ${municipioName} (${municipioCode})`)
      } else {
        createdMunicipalities.set(municipioName, existing.id)
        console.log(`   ℹ️  Ya existe: ${municipioName}`)
      }
    }
    
    console.log()
    
    // 4. Importar puestos faltantes del CSV
    console.log('📥 Paso 4: Importando puestos faltantes del CSV...')
    
    const csvPath = path.join(process.cwd(), 'Genio', 'DIVIPOLE NACIONALPiolo.csv')
    const content = fs.readFileSync(csvPath, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim())
    
    let stationsCreated = 0
    let tablesCreated = 0
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const parts = line.split(';')
      
      if (parts.length < 9) continue
      
      const municipioName = parts[1]?.trim()
      const puestoName = parts[2]?.trim()
      
      if (!municipioName || !puestoName) continue
      
      // Solo procesar ARROYO HONDO, RIOVIEJO y el puesto faltante de MARIA LA BAJA
      const shouldProcess = 
        municipioName === 'ARROYO HONDO' ||
        municipioName === 'RIOVIEJO' ||
        (municipioName === 'MARIA LA BAJA' && puestoName === 'I.E. RAFAEL URIBE URIBE SEDE 4')
      
      if (!shouldProcess) continue
      
      // Buscar municipio
      let municipalityId = createdMunicipalities.get(municipioName)
      
      if (!municipalityId) {
        const municipality = await prisma.municipality.findFirst({
          where: { name: municipioName }
        })
        
        if (!municipality) {
          console.log(`   ⚠️  Municipio no encontrado: ${municipioName}`)
          continue
        }
        
        municipalityId = municipality.id
      }
      
      // Verificar si el puesto ya existe
      const existing = await prisma.pollingStation.findFirst({
        where: {
          name: puestoName,
          municipalityId
        }
      })
      
      if (existing) {
        console.log(`   ℹ️  Ya existe: ${municipioName} - ${puestoName}`)
        continue
      }
      
      // Crear puesto
      const totalVoters = parseInt(parts[5]) || 0
      const maleVoters = parseInt(parts[4]) || 0
      const femaleVoters = parseInt(parts[3]) || 0
      const totalTables = parseInt(parts[6]) || 0
      
      const count = await prisma.pollingStation.count()
      const puestoCode = `13-${String(count + 1).padStart(4, '0')}`
      
      const newStation = await prisma.pollingStation.create({
        data: {
          name: puestoName,
          code: puestoCode,
          address: parts[8]?.trim() || null,
          community: parts[7]?.trim() || null,
          totalVoters,
          maleVoters,
          femaleVoters,
          totalTables,
          camara: true,
          senado: true,
          municipalityId
        }
      })
      
      // Crear mesas
      if (totalTables > 0) {
        const tables = []
        for (let tableNum = 1; tableNum <= totalTables; tableNum++) {
          tables.push({
            number: tableNum,
            pollingStationId: newStation.id
          })
        }
        
        await prisma.table.createMany({
          data: tables
        })
        
        tablesCreated += totalTables
      }
      
      stationsCreated++
      console.log(`   ✅ Creado: ${municipioName} - ${puestoName} (${totalTables} mesas)`)
    }
    
    console.log(`\n   ✅ Total puestos creados: ${stationsCreated}`)
    console.log(`   ✅ Total mesas creadas: ${tablesCreated}\n`)
    
    // 5. Verificar resultado final
    console.log('📊 Paso 5: Verificando resultado final...\n')
    
    const finalMunicipalities = await prisma.municipality.count()
    const finalStations = await prisma.pollingStation.count()
    
    console.log(`   ✅ Total municipios: ${finalMunicipalities} (esperado: 46)`)
    console.log(`   ✅ Total puestos: ${finalStations} (esperado: 639)`)
    
    if (finalMunicipalities === 46 && finalStations === 639) {
      console.log('\n🎉 ¡CORRECCIÓN COMPLETADA EXITOSAMENTE!')
    } else {
      console.log('\n⚠️  Los números no coinciden con lo esperado')
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixMunicipalitiesAndStations()
