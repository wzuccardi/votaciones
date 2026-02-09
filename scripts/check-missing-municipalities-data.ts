import * as fs from 'fs'
import * as path from 'path'

const csvPath = path.join(process.cwd(), 'Genio', 'DIVIPOLE NACIONALPiolo.csv')

try {
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())
  
  const missingMunicipalities = ['ARROYO HONDO', 'RIOVIEJO']
  
  console.log('📊 DATOS DE MUNICIPIOS FALTANTES\n')
  
  missingMunicipalities.forEach(municipality => {
    const municipalityLines = lines.filter(line => {
      const parts = line.split(';')
      return parts[1]?.trim().toUpperCase() === municipality
    })
    
    console.log(`\n📍 ${municipality}`)
    console.log(`   Total de puestos: ${municipalityLines.length}`)
    
    if (municipalityLines.length > 0) {
      console.log(`   Puestos:`)
      municipalityLines.forEach((line, i) => {
        const parts = line.split(';')
        const puesto = parts[2]?.trim()
        console.log(`      ${i + 1}. ${puesto}`)
      })
    }
  })
  
  console.log('\n' + '='.repeat(60))
  
} catch (error) {
  console.error('❌ Error:', error)
}
