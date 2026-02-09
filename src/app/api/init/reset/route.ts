import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const colombiaDepartments = [
  { name: 'Amazonas', code: '91' },
  { name: 'Antioquia', code: '05' },
  { name: 'Arauca', code: '81' },
  { name: 'Archipiélago de San Andrés, Providencia y Santa Catalina', code: '88' },
  { name: 'Atlántico', code: '08' },
  { name: 'Bogotá D.C.', code: '11' },
  { name: 'Bolívar', code: '13' },
  { name: 'Boyacá', code: '15' },
  { name: 'Caldas', code: '17' },
  { name: 'Caquetá', code: '18' },
  { name: 'Casanare', code: '19' },
  { name: 'Cauca', code: '20' },
  { name: 'Cesar', code: '23' },
  { name: 'Chocó', code: '27' },
  { name: 'Córdoba', code: '26' },
  { name: 'Cundinamarca', code: '25' },
  { name: 'Guainía', code: '94' },
  { name: 'Guaviare', code: '95' },
  { name: 'Huila', code: '41' },
  { name: 'La Guajira', code: '44' },
  { name: 'Magdalena', code: '47' },
  { name: 'Meta', code: '50' },
  { name: 'Nariño', code: '52' },
  { name: 'Norte de Santander', code: '54' },
  { name: 'Putumayo', code: '86' },
  { name: 'Quindío', code: '63' },
  { name: 'Risaralda', code: '66' },
  { name: 'San Martín', code: '70' },
  { name: 'Santander', code: '68' },
  { name: 'Sucre', code: '71' },
  { name: 'Tolima', code: '73' },
  { name: 'Valle del Cauca', code: '76' },
  { name: 'Vaupés', code: '97' },
  { name: 'Vichada', code: '99' }
]

const colombiaMunicipalities = [
  // Antioquia
  { departmentName: 'Antioquia', name: 'Medellín', code: '05001' },
  { departmentName: 'Antioquia', name: 'Envigado', code: '05062' },
  { departmentName: 'Antioquia', name: 'Bello', code: '05031' },
  { departmentName: 'Antioquia', name: 'Itagüí', code: '05036' },
  { departmentName: 'Antioquia', name: 'Rionegro', code: '05570' },
  // Bogotá D.C.
  { departmentName: 'Bogotá D.C.', name: 'Bogotá D.C.', code: '11001' },
  // Valle del Cauca
  { departmentName: 'Valle del Cauca', name: 'Cali', code: '76001' },
  { departmentName: 'Valle del Cauca', name: 'Buenaventura', code: '76109' },
  { departmentName: 'Valle del Cauca', name: 'Palmira', code: '76533' },
  // Atlántico
  { departmentName: 'Atlántico', name: 'Barranquilla', code: '08001' },
  { departmentName: 'Atlántico', name: 'Soledad', code: '08758' },
  { departmentName: 'Atlántico', name: 'Malambo', code: '08450' },
  // Santander
  { departmentName: 'Santander', name: 'Bucaramanga', code: '68001' },
  { departmentName: 'Santander', name: 'Floridablanca', code: '68276' },
  { departmentName: 'Santander', name: 'Girón', code: '68319' },
  // Bolívar
  { departmentName: 'Bolívar', name: 'Cartagena', code: '13001' },
  { departmentName: 'Bolívar', name: 'Magangué', code: '13480' },
  { departmentName: 'Bolívar', name: 'Turbaco', code: '13786' },
  // Cundinamarca
  { departmentName: 'Cundinamarca', name: 'Soacha', code: '25760' },
  { departmentName: 'Cundinamarca', name: 'Fusagasugá', code: '25268' },
  { departmentName: 'Cundinamarca', name: 'Girardot', code: '25313' },
  // Norte de Santander
  { departmentName: 'Norte de Santander', name: 'Cúcuta', code: '54001' },
  { departmentName: 'Norte de Santander', name: 'Villa del Rosario', code: '54882' },
  { departmentName: 'Norte de Santander', name: 'Los Patios', code: '54415' },
  // Tolima
  { departmentName: 'Tolima', name: 'Ibagué', code: '73001' },
  { departmentName: 'Tolima', name: 'Espinal', code: '73287' },
  { departmentName: 'Tolima', name: 'Melgar', code: '73496' },
  // Huila
  { departmentName: 'Huila', name: 'Neiva', code: '41001' },
  { departmentName: 'Huila', name: 'Pitalito', code: '41570' },
  { departmentName: 'Huila', name: 'Garzón', code: '41305' },
  // Risaralda
  { departmentName: 'Risaralda', name: 'Pereira', code: '66001' },
  { departmentName: 'Risaralda', name: 'Dosquebradas', code: '66258' },
  { departmentName: 'Risaralda', name: 'Santa Rosa de Cabal', code: '66751' },
  // Quindío
  { departmentName: 'Quindío', name: 'Armenia', code: '63001' },
  { departmentName: 'Quindío', name: 'Calarcá', code: '63140' },
  { departmentName: 'Quindío', name: 'Montenegro', code: '63496' },
  // Cesar
  { departmentName: 'Cesar', name: 'Valledupar', code: '23001' },
  { departmentName: 'Cesar', name: 'Aguachica', code: '23034' },
  { departmentName: 'Cesar', name: 'La Jagua de Ibirico', code: '23399' },
  // Magdalena
  { departmentName: 'Magdalena', name: 'Santa Marta', code: '47001' },
  { departmentName: 'Magdalena', name: 'Ciénaga', code: '47214' },
  { departmentName: 'Magdalena', name: 'Fundación', code: '47295' },
  // Boyacá
  { departmentName: 'Boyacá', name: 'Tunja', code: '15001' },
  { departmentName: 'Boyacá', name: 'Duitama', code: '15238' },
  { departmentName: 'Boyacá', name: 'Sogamoso', code: '15738' },
  // Córdoba
  { departmentName: 'Córdoba', name: 'Montería', code: '23400' },
  { departmentName: 'Córdoba', name: 'Lorica', code: '23447' },
  { departmentName: 'Córdoba', name: 'Cereté', code: '23220' },
  // Nariño
  { departmentName: 'Nariño', name: 'Pasto', code: '52001' },
  { departmentName: 'Nariño', name: 'Ipiales', code: '52370' },
  { departmentName: 'Nariño', name: 'Túquerres', code: '52828' },
  // Meta
  { departmentName: 'Meta', name: 'Villavicencio', code: '50001' },
  { departmentName: 'Meta', name: 'Acacías', code: '50003' },
  { departmentName: 'Meta', name: 'Granada', code: '50318' }
]

export async function POST(req: NextRequest) {
  try {
    // Delete all geographic data
    await db.pollingStation.deleteMany({})
    await db.voter.deleteMany({})
    await db.leader.deleteMany({})
    await db.candidate.deleteMany({})
    await db.municipality.deleteMany({})
    await db.department.deleteMany({})

    // Create departments
    const departments = await Promise.all(
      colombiaDepartments.map(dept =>
        db.department.create({
          data: dept
        })
      )
    )

    // Create municipalities
    const municipalities = await Promise.all(
      colombiaMunicipalities.map(muni => {
        const department = departments.find(d => d.name === muni.departmentName)
        if (!department) return null

        return db.municipality.create({
          data: {
            name: muni.name,
            code: muni.code,
            departmentId: department.id
          }
        })
      })
    )

    const validMunicipalities = municipalities.filter(m => m !== null)

    return NextResponse.json({
      success: true,
      message: 'Base de datos reinicializada con datos de Colombia',
      data: {
        departments: departments.length,
        municipalities: validMunicipalities.length
      }
    })

  } catch (error) {
    console.error('Error resetting database:', error)
    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al reinicializar la base de datos'
    }, { status: 500 })
  }
}
