import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function countMunicipalities() {
  try {
    console.log('📊 Contando municipios...\n')
    
    // Total de municipios
    const total = await prisma.municipality.count()
    console.log(`✅ Total de municipios: ${total}`)
    
    // Listar todos los municipios
    const municipalities = await prisma.municipality.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            pollingStations: true
          }
        }
      }
    })
    
    console.log(`\n📍 Lista completa de municipios:\n`)
    municipalities.forEach((m, i) => {
      console.log(`   ${(i + 1).toString().padStart(2, '0')}. ${m.name.padEnd(30, ' ')} - ${m._count.pollingStations} puestos`)
    })
    
    // Verificar departamento
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            municipalities: true
          }
        }
      }
    })
    
    console.log(`\n🏛️  Departamentos:`)
    departments.forEach(d => {
      console.log(`   ${d.name}: ${d._count.municipalities} municipios`)
    })
    
    console.log('\n' + '='.repeat(60))
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

countMunicipalities()
