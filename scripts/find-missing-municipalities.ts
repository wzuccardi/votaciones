import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function findMissingMunicipalities() {
  try {
    // Leer CSV
    const csvPath = path.join(process.cwd(), 'Genio', 'DIVIPOLE NACIONALPiolo.csv')
    const content = fs.readFileSync(csvPath, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim())
    
    const bolivarLines = lines.filter(line => {
      const parts = line.split(';')
      return parts[0]?.toUpperCase().includes('BOLIVAR')
    })
    
    const csvMunicipalities = new Set<string>()
    bolivarLines.forEach(line => {
      const parts = line.split(';')
      if (parts[1]) {
        csvMunicipalities.add(parts[1].trim().toUpperCase())
      }
    })
    
    // Leer DB
    const dbMunicipalities = await prisma.municipality.findMany({
      select: { name: true }
    })
    
    const dbMunicipalityNames = new Set(
      dbMunicipalities.map(m => m.name.toUpperCase())
    )
    
    // Encontrar diferencias
    const inCsvNotInDb = Array.from(csvMunicipalities).filter(
      m => !dbMunicipalityNames.has(m)
    )
    
    const inDbNotInCsv = Array.from(dbMunicipalityNames).filter(
      m => !csvMunicipalities.has(m)
    )
    
    console.log('📊 ANÁLISIS DE MUNICIPIOS\n')
    console.log(`✅ En CSV: ${csvMunicipalities.size} municipios`)
    console.log(`✅ En DB: ${dbMunicipalityNames.size} municipios\n`)
    
    if (inCsvNotInDb.length > 0) {
      console.log(`❌ FALTAN EN LA BASE DE DATOS (${inCsvNotInDb.length}):`)
      inCsvNotInDb.forEach(m => console.log(`   - ${m}`))
      console.log()
    }
    
    if (inDbNotInCsv.length > 0) {
      console.log(`⚠️  EN DB PERO NO EN CSV (${inDbNotInCsv.length}):`)
      inDbNotInCsv.forEach(m => console.log(`   - ${m}`))
      console.log()
    }
    
    if (inCsvNotInDb.length === 0 && inDbNotInCsv.length === 0) {
      console.log('✅ Todos los municipios coinciden!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findMissingMunicipalities()
