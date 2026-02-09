import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function compareDbVsCsv() {
  try {
    // Leer CSV
    const csvPath = path.join(process.cwd(), 'Genio', 'DIVIPOLE NACIONALPiolo.csv')
    const content = fs.readFileSync(csvPath, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim())
    
    const csvStations = new Set<string>()
    
    lines.forEach((line, index) => {
      if (index === 0) return // Skip header
      const parts = line.split(';')
      if (parts[0]?.toUpperCase().includes('BOLIVAR')) {
        const municipio = parts[1]?.trim()
        const puesto = parts[2]?.trim()
        if (municipio && puesto) {
          csvStations.add(`${municipio}|${puesto}`)
        }
      }
    })
    
    // Leer DB
    const dbStations = await prisma.pollingStation.findMany({
      include: {
        municipality: true
      }
    })
    
    const dbStationKeys = new Set(
      dbStations.map(s => `${s.municipality.name}|${s.name}`)
    )
    
    // Comparar
    const inDbNotInCsv = Array.from(dbStationKeys).filter(key => !csvStations.has(key))
    const inCsvNotInDb = Array.from(csvStations).filter(key => !dbStationKeys.has(key))
    
    console.log('📊 COMPARACIÓN DB vs CSV\n')
    console.log(`✅ Puestos en CSV: ${csvStations.size}`)
    console.log(`✅ Puestos en DB: ${dbStationKeys.size}\n`)
    
    if (inDbNotInCsv.length > 0) {
      console.log(`❌ EN DB PERO NO EN CSV (${inDbNotInCsv.length}):`)
      inDbNotInCsv.forEach(key => {
        const [municipio, puesto] = key.split('|')
        console.log(`   - ${municipio}: ${puesto}`)
      })
      console.log()
    }
    
    if (inCsvNotInDb.length > 0) {
      console.log(`⚠️  EN CSV PERO NO EN DB (${inCsvNotInDb.length}):`)
      inCsvNotInDb.slice(0, 20).forEach(key => {
        const [municipio, puesto] = key.split('|')
        console.log(`   - ${municipio}: ${puesto}`)
      })
      if (inCsvNotInDb.length > 20) {
        console.log(`   ... y ${inCsvNotInDb.length - 20} más`)
      }
      console.log()
    }
    
    if (inDbNotInCsv.length === 0 && inCsvNotInDb.length === 0) {
      console.log('✅ Todos los puestos coinciden perfectamente!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

compareDbVsCsv()
