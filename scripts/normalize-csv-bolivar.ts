import * as fs from 'fs'

const CSV_PATH = 'Genio/Divipole_Elecciones_Territoritoriales_2023_con_georreferenciación_20260119 (1).csv'
const OUTPUT_PATH = 'Genio/Divipole_NORMALIZED.csv'

async function normalizeCSV() {
  console.log('📄 Normalizando CSV - Convirtiendo "Bolivar" a "BOLIVAR"...\n')
  
  try {
    // Leer el archivo CSV
    console.log(`📖 Leyendo archivo: ${CSV_PATH}`)
    const content = fs.readFileSync(CSV_PATH, 'utf-8')
    const lines = content.split('\n')
    console.log(`  ✓ Total de líneas: ${lines.length}`)
    
    // Contar registros antes
    const bolivarMayusBefore = lines.filter(line => line.startsWith('"BOLIVAR"')).length
    const bolivarMinusBefore = lines.filter(line => line.startsWith('"Bolivar"')).length
    
    console.log(`\n📊 Estado inicial:`)
    console.log(`  - "BOLIVAR" (mayúsculas): ${bolivarMayusBefore}`)
    console.log(`  - "Bolivar" (minúsculas): ${bolivarMinusBefore}`)
    console.log(`  - Total Bolívar: ${bolivarMayusBefore + bolivarMinusBefore}`)
    
    // Normalizar: convertir "Bolivar" a "BOLIVAR"
    console.log(`\n🔄 Normalizando...`)
    const normalizedLines = lines.map(line => {
      if (line.startsWith('"Bolivar"')) {
        return line.replace(/^"Bolivar"/, '"BOLIVAR"')
      }
      return line
    })
    
    // Contar registros después
    const bolivarMayusAfter = normalizedLines.filter(line => line.startsWith('"BOLIVAR"')).length
    const bolivarMinusAfter = normalizedLines.filter(line => line.startsWith('"Bolivar"')).length
    
    console.log(`\n📊 Estado final:`)
    console.log(`  - "BOLIVAR" (mayúsculas): ${bolivarMayusAfter}`)
    console.log(`  - "Bolivar" (minúsculas): ${bolivarMinusAfter}`)
    console.log(`  - Total Bolívar: ${bolivarMayusAfter + bolivarMinusAfter}`)
    
    // Guardar archivo normalizado
    console.log(`\n💾 Guardando archivo normalizado: ${OUTPUT_PATH}`)
    fs.writeFileSync(OUTPUT_PATH, normalizedLines.join('\n'), 'utf-8')
    console.log(`  ✓ Archivo guardado exitosamente`)
    
    console.log(`\n✅ Normalización completada!`)
    console.log(`  - Registros convertidos: ${bolivarMinusBefore}`)
    console.log(`  - Total registros de Bolívar: ${bolivarMayusAfter}`)
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    throw error
  }
}

normalizeCSV()
  .then(() => {
    console.log('\n🎉 Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  })
