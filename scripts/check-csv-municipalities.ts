import * as fs from 'fs'
import * as path from 'path'

const csvPath = path.join(process.cwd(), 'Genio', 'DIVIPOLE NACIONALPiolo.csv')

try {
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())
  
  console.log(`📄 Total de líneas en CSV: ${lines.length}`)
  
  // El CSV usa punto y coma como delimitador
  // Estructura: departamento;municipio;puesto;...
  const bolivarLines = lines.filter(line => {
    const parts = line.split(';')
    return parts[0]?.toUpperCase().includes('BOLIVAR')
  })
  
  console.log(`📍 Líneas de Bolívar: ${bolivarLines.length}`)
  
  // Extraer municipios únicos
  const municipalities = new Set<string>()
  bolivarLines.forEach(line => {
    const parts = line.split(';')
    if (parts[1]) {
      municipalities.add(parts[1].trim())
    }
  })
  
  const municipalityList = Array.from(municipalities).sort()
  
  console.log(`\n✅ Total de municipios únicos en CSV: ${municipalityList.length}`)
  console.log('\n📋 Lista de municipios:')
  municipalityList.forEach((m, i) => {
    console.log(`   ${(i + 1).toString().padStart(2, '0')}. ${m}`)
  })
  
} catch (error) {
  console.error('❌ Error:', error)
}
