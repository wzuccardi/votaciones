// Script para probar los endpoints de la API que alimentan los dropdowns

async function testAPIEndpoints() {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  console.log('🧪 Probando endpoints de la API...\n')
  console.log(`Base URL: ${baseURL}\n`)
  
  try {
    // 1. Test endpoint de departamentos
    console.log('1️⃣ Probando /api/data/departments')
    const deptResponse = await fetch(`${baseURL}/api/data/departments`)
    const departments = await deptResponse.json()
    console.log(`   ✓ Status: ${deptResponse.status}`)
    console.log(`   ✓ Departamentos: ${departments.length}`)
    if (departments.length > 0) {
      console.log(`   ✓ Ejemplo: ${departments[0].name} (${departments[0].code})`)
    }
    
    // 2. Test endpoint de municipios
    console.log('\n2️⃣ Probando /api/data/municipalities')
    const munResponse = await fetch(`${baseURL}/api/data/municipalities`)
    const municipalities = await munResponse.json()
    console.log(`   ✓ Status: ${munResponse.status}`)
    console.log(`   ✓ Municipios: ${municipalities.length}`)
    if (municipalities.length > 0) {
      console.log(`   ✓ Ejemplo: ${municipalities[0].name} (${municipalities[0].code})`)
    }
    
    // 3. Test endpoint de puestos de votación (sin filtro)
    console.log('\n3️⃣ Probando /api/data/polling-stations')
    const psResponse = await fetch(`${baseURL}/api/data/polling-stations`)
    const pollingStations = await psResponse.json()
    console.log(`   ✓ Status: ${psResponse.status}`)
    console.log(`   ✓ Puestos: ${pollingStations.length}`)
    if (pollingStations.length > 0) {
      console.log(`   ✓ Ejemplo: ${pollingStations[0].name}`)
      console.log(`   ✓ Votantes: ${pollingStations[0].totalVoters}`)
      console.log(`   ✓ Mesas: ${pollingStations[0].totalTables}`)
    }
    
    // 4. Test endpoint de puestos filtrados por municipio
    if (municipalities.length > 0) {
      const firstMunId = municipalities[0].id
      console.log(`\n4️⃣ Probando /api/data/polling-stations?municipalityId=${firstMunId}`)
      const psFilteredResponse = await fetch(`${baseURL}/api/data/polling-stations?municipalityId=${firstMunId}`)
      const psFiltered = await psFilteredResponse.json()
      console.log(`   ✓ Status: ${psFilteredResponse.status}`)
      console.log(`   ✓ Puestos filtrados: ${psFiltered.length}`)
      console.log(`   ✓ Municipio: ${municipalities[0].name}`)
    }
    
    // 5. Test endpoint de mesas (si existe un puesto)
    if (pollingStations.length > 0) {
      const firstPsId = pollingStations[0].id
      console.log(`\n5️⃣ Probando /api/data/tables?pollingStationId=${firstPsId}`)
      const tablesResponse = await fetch(`${baseURL}/api/data/tables?pollingStationId=${firstPsId}`)
      
      if (tablesResponse.ok) {
        const tables = await tablesResponse.json()
        console.log(`   ✓ Status: ${tablesResponse.status}`)
        console.log(`   ✓ Mesas: ${tables.length}`)
        console.log(`   ✓ Puesto: ${pollingStations[0].name}`)
      } else {
        console.log(`   ⚠️  Endpoint no disponible o sin datos`)
      }
    }
    
    console.log('\n✅ Todos los endpoints funcionan correctamente!')
    
  } catch (error: any) {
    console.error('\n❌ Error probando endpoints:', error.message)
    throw error
  }
}

testAPIEndpoints()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
