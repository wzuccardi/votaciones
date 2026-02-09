import { db } from '../src/lib/db'

async function testMunicipalitiesAndFilters() {
  console.log('🧪 Probando Municipios y Filtros\n')

  // 1. Verificar departamento
  console.log('📊 1. Verificando Departamento...')
  const department = await db.department.findUnique({
    where: { code: '13' }
  })
  
  if (!department) {
    console.log('❌ Departamento de Bolívar no encontrado')
    return
  }
  console.log(`✅ Departamento: ${department.name} (${department.code})`)

  // 2. Listar todos los municipios
  console.log('\n📊 2. Listando Municipios de Bolívar...')
  const municipalities = await db.municipality.findMany({
    where: { departmentId: department.id },
    orderBy: { name: 'asc' }
  })
  
  console.log(`✅ Total de municipios: ${municipalities.length}`)
  console.log('\nMunicipios:')
  municipalities.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.name}`)
  })

  // 3. Verificar puestos por municipio
  console.log('\n📊 3. Verificando Puestos por Municipio...')
  
  // Tomar 5 municipios de ejemplo
  const sampleMunicipalities = municipalities.slice(0, 5)
  
  for (const municipality of sampleMunicipalities) {
    const pollingStations = await db.pollingStation.findMany({
      where: { municipalityId: municipality.id }
    })
    
    console.log(`   ${municipality.name}: ${pollingStations.length} puestos`)
  }

  // 4. Verificar filtro de puestos por municipio específico
  console.log('\n📊 4. Probando Filtro de Puestos...')
  
  // Buscar Cartagena
  const cartagena = municipalities.find(m => m.name.includes('CARTAGENA'))
  
  if (cartagena) {
    const cartagenaStations = await db.pollingStation.findMany({
      where: { municipalityId: cartagena.id },
      orderBy: { name: 'asc' }
    })
    
    console.log(`✅ Cartagena tiene ${cartagenaStations.length} puestos de votación`)
    console.log('\nPrimeros 10 puestos en Cartagena:')
    cartagenaStations.slice(0, 10).forEach((ps, i) => {
      console.log(`   ${i + 1}. ${ps.name}`)
    })
  }

  // 5. Verificar mesas por puesto
  console.log('\n📊 5. Verificando Mesas por Puesto...')
  
  if (cartagena) {
    const firstStation = await db.pollingStation.findFirst({
      where: { municipalityId: cartagena.id },
      include: {
        tables: true
      }
    })
    
    if (firstStation) {
      console.log(`✅ Puesto: ${firstStation.name}`)
      console.log(`   Total de mesas: ${firstStation.totalTables}`)
      console.log(`   Mesas en BD: ${firstStation.tables.length}`)
      console.log(`   Votantes: ${firstStation.totalVoters}`)
    }
  }

  // 6. Verificar que los filtros funcionan correctamente
  console.log('\n📊 6. Probando Filtros en Cascada...')
  
  // Simular selección de municipio -> puestos -> mesas
  const testMunicipality = municipalities[0]
  console.log(`\n   Municipio seleccionado: ${testMunicipality.name}`)
  
  const stationsInMunicipality = await db.pollingStation.findMany({
    where: { municipalityId: testMunicipality.id }
  })
  console.log(`   ✅ Puestos disponibles: ${stationsInMunicipality.length}`)
  
  if (stationsInMunicipality.length > 0) {
    const testStation = stationsInMunicipality[0]
    console.log(`\n   Puesto seleccionado: ${testStation.name}`)
    
    const tablesInStation = await db.table.findMany({
      where: { pollingStationId: testStation.id },
      orderBy: { number: 'asc' }
    })
    console.log(`   ✅ Mesas disponibles: ${tablesInStation.length}`)
    
    if (tablesInStation.length > 0) {
      console.log(`   Mesas: ${tablesInStation.map(t => t.number).join(', ')}`)
    }
  }

  // 7. Resumen final
  console.log('\n📊 7. Resumen de Verificación:')
  console.log(`   ✅ Departamento: 1 (Bolívar)`)
  console.log(`   ✅ Municipios: ${municipalities.length}`)
  
  const totalStations = await db.pollingStation.count()
  console.log(`   ✅ Puestos de votación: ${totalStations}`)
  
  const totalTables = await db.table.count()
  console.log(`   ✅ Mesas electorales: ${totalTables}`)

  // 8. Verificar que no hay municipios duplicados
  console.log('\n📊 8. Verificando Integridad...')
  const uniqueNames = new Set(municipalities.map(m => m.name))
  if (uniqueNames.size === municipalities.length) {
    console.log('   ✅ No hay municipios duplicados')
  } else {
    console.log('   ⚠️  Hay municipios duplicados')
  }

  // 9. Verificar que todos los puestos tienen municipio
  const allStations = await db.pollingStation.findMany()
  const stationsWithoutMunicipality = allStations.filter(s => !s.municipalityId).length
  
  if (stationsWithoutMunicipality === 0) {
    console.log('   ✅ Todos los puestos tienen municipio asignado')
  } else {
    console.log(`   ⚠️  ${stationsWithoutMunicipality} puestos sin municipio`)
  }

  // 10. Verificar que todos los puestos tienen mesas
  const stationsWithTables = await db.pollingStation.findMany({
    include: {
      tables: true
    }
  })
  
  const stationsWithoutTables = stationsWithTables.filter(s => s.tables.length === 0)
  
  if (stationsWithoutTables.length === 0) {
    console.log('   ✅ Todos los puestos tienen mesas asignadas')
  } else {
    console.log(`   ⚠️  ${stationsWithoutTables.length} puestos sin mesas`)
  }

  console.log('\n✅ Prueba completada\n')
}

testMunicipalitiesAndFilters()
  .then(() => {
    console.log('🎉 Todas las pruebas completadas')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en las pruebas:', error)
    process.exit(1)
  })
