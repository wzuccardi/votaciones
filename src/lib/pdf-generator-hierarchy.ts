import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Voter {
  document: string
  name: string
  celular?: string
  pollingStation?: {
    name: string
    municipality: {
      name: string
    }
  }
}

interface LeaderNode {
  id: string
  document: string
  name: string
  voters: Voter[]
  votersCount: number
  subLeaders: LeaderNode[]
  subLeadersCount: number
  totalVoters: number
  totalSubLeaders: number
}

export function generateHierarchyPDF(
  hierarchy: LeaderNode,
  candidateName: string
): string {
  const doc = new jsPDF()
  let yPosition = 20

  // Título
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Reporte Jerárquico de Líderes y Votantes', 105, yPosition, { align: 'center' })
  
  yPosition += 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Candidato: ${candidateName}`, 105, yPosition, { align: 'center' })
  
  yPosition += 5
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 105, yPosition, { align: 'center' })
  
  yPosition += 15

  // Resumen General
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen General', 14, yPosition)
  yPosition += 8

  const summaryData = [
    ['Líder Principal', hierarchy.name],
    ['Cédula', hierarchy.document],
    ['Total de Votantes Directos', hierarchy.votersCount.toString()],
    ['Total de Sublíderes', hierarchy.totalSubLeaders.toString()],
    ['Total de Votantes (incluyendo sublíderes)', hierarchy.totalVoters.toString()]
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { cellWidth: 100 }
    }
  })

  yPosition = (doc as any).lastAutoTable.finalY + 15

  // Función recursiva para imprimir la jerarquía
  function printLeaderSection(leader: LeaderNode, level: number = 0) {
    // Verificar si necesitamos una nueva página
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    const indent = level * 10
    const isSubLeader = level > 0

    // Encabezado del líder
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(isSubLeader ? 220 : 200, isSubLeader ? 230 : 220, isSubLeader ? 255 : 240)
    doc.rect(14 + indent, yPosition - 5, 182 - indent, 8, 'F')
    
    const leaderTitle = isSubLeader ? `Sublíder: ${leader.name}` : `Líder: ${leader.name}`
    doc.text(leaderTitle, 16 + indent, yPosition)
    yPosition += 3

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`CC: ${leader.document} | Votantes directos: ${leader.votersCount}`, 16 + indent, yPosition)
    yPosition += 10

    // Tabla de votantes del líder
    if (leader.voters.length > 0) {
      const votersData = leader.voters.map(voter => [
        voter.document,
        voter.name,
        voter.celular || 'N/A',
        voter.pollingStation?.municipality.name || 'N/A',
        voter.pollingStation?.name || 'N/A'
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Cédula', 'Nombre', 'Celular', 'Municipio', 'Puesto de Votación']],
        body: votersData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [100, 150, 200] },
        margin: { left: 14 + indent },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 'auto' }
        }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10
    } else {
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.text('Sin votantes registrados', 16 + indent, yPosition)
      doc.setTextColor(0, 0, 0)
      yPosition += 10
    }

    // Procesar sublíderes recursivamente
    if (leader.subLeaders && leader.subLeaders.length > 0) {
      leader.subLeaders.forEach(subLeader => {
        printLeaderSection(subLeader, level + 1)
      })
    }
  }

  // Imprimir toda la jerarquía
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Estructura Jerárquica Detallada', 14, yPosition)
  yPosition += 10

  printLeaderSection(hierarchy)

  // Pie de página en todas las páginas
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Página ${i} de ${pageCount}`,
      105,
      290,
      { align: 'center' }
    )
    doc.text(
      'Reporte Confidencial - Solo para uso interno de la campaña',
      105,
      285,
      { align: 'center' }
    )
  }

  // Generar nombre de archivo
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const fileName = `Jerarquia_${hierarchy.name.replace(/\s+/g, '_')}_${timestamp}.pdf`

  // Guardar PDF
  doc.save(fileName)

  return fileName
}
