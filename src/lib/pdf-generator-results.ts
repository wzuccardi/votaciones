import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface TableResult {
  id: string
  number: number
  pollingStation: {
    name: string
    code: string
    municipality: { name: string }
  }
  votesCandidate: number | null
  totalVotes: number | null
  votesRegistered: number | null
  reportedAt: string | null
  witness: {
    voter: { 
      name: string
      document: string
    }
    leader: {
      name: string
      document: string
    }
  } | null
  isValidated: boolean
}

interface Stats {
  totalTables: number
  tablesReported: number
  tablesValidated: number
  totalVotesCandidate: number
  totalVotesGeneral: number
  percentage: number
  lastUpdate: string | null
}

interface PollingStationSummary {
  id: string
  name: string
  code: string
  municipality: string
  totalTables: number
  tablesReported: number
  votesCandidate: number
  totalVotes: number
  percentage: number
  witnesses: Array<{
    name: string
    document: string
    leader: string
    tablesAssigned: number[]
  }>
}

interface MunicipalitySummary {
  name: string
  totalTables: number
  tablesReported: number
  votesCandidate: number
  totalVotes: number
  percentage: number
}

export function generateElectoralResultsPDF(
  stats: Stats,
  tableResults: TableResult[],
  pollingStations: PollingStationSummary[],
  municipalities: MunicipalitySummary[],
  candidateName: string = 'Alonso del Río'
) {
  const doc = new jsPDF()
  let yPos = 20

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RESULTADOS ELECTORALES EN TIEMPO REAL', 105, yPos, { align: 'center' })
  
  yPos += 8
  doc.setFontSize(14)
  doc.text(candidateName, 105, yPos, { align: 'center' })
  
  yPos += 6
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Cámara 103 - Partido Conservador', 105, yPos, { align: 'center' })
  
  yPos += 10
  doc.setFontSize(9)
  doc.setTextColor(100)
  const now = new Date()
  doc.text(`Generado: ${now.toLocaleString('es-CO')}`, 105, yPos, { align: 'center' })
  
  if (stats.lastUpdate) {
    yPos += 4
    const lastUpdate = new Date(stats.lastUpdate)
    doc.text(`Última actualización: ${lastUpdate.toLocaleString('es-CO')}`, 105, yPos, { align: 'center' })
  }
  
  yPos += 10
  doc.setTextColor(0)

  // Resumen General
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN GENERAL', 14, yPos)
  yPos += 7

  const summaryData = [
    ['Mesas Reportadas', `${stats.tablesReported} / ${stats.totalTables}`, `${((stats.tablesReported / stats.totalTables) * 100).toFixed(1)}%`],
    ['Mesas Validadas', `${stats.tablesValidated}`, `${((stats.tablesValidated / stats.totalTables) * 100).toFixed(1)}%`],
    ['Votos Obtenidos', stats.totalVotesCandidate.toLocaleString('es-CO'), ''],
    ['Total Votos', stats.totalVotesGeneral.toLocaleString('es-CO'), ''],
    ['Porcentaje', '', `${stats.percentage.toFixed(2)}%`]
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Indicador', 'Cantidad', 'Porcentaje']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { halign: 'center', cellWidth: 60 },
      2: { halign: 'center', cellWidth: 40, fontStyle: 'bold' }
    }
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // Resultados por Municipio
  if (municipalities.length > 0) {
    doc.addPage()
    yPos = 20
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('RESULTADOS POR MUNICIPIO', 14, yPos)
    yPos += 7

    const municipalityData = municipalities.map(m => [
      m.name,
      `${m.tablesReported}/${m.totalTables}`,
      m.votesCandidate.toLocaleString('es-CO'),
      m.totalVotes.toLocaleString('es-CO'),
      `${m.percentage.toFixed(2)}%`
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Municipio', 'Mesas', 'Nuestros Votos', 'Total Votos', '%']],
      body: municipalityData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219], fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'center', cellWidth: 25, fontStyle: 'bold' }
      }
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // Resultados por Puesto de Votación
  if (pollingStations.length > 0) {
    doc.addPage()
    yPos = 20
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('RESULTADOS POR PUESTO DE VOTACIÓN', 14, yPos)
    yPos += 7

    const stationData = pollingStations.map(ps => [
      ps.name,
      ps.municipality,
      `${ps.tablesReported}/${ps.totalTables}`,
      ps.votesCandidate.toLocaleString('es-CO'),
      ps.totalVotes.toLocaleString('es-CO'),
      `${ps.percentage.toFixed(1)}%`
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Puesto', 'Municipio', 'Mesas', 'Votos', 'Total', '%']],
      body: stationData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219], fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }
      }
    })
  }

  // Detalle de Mesas Reportadas
  if (tableResults.length > 0) {
    doc.addPage()
    yPos = 20
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DE MESAS REPORTADAS', 14, yPos)
    yPos += 7

    const tableData = tableResults
      .filter(t => t.reportedAt)
      .map(t => [
        `Mesa ${t.number}`,
        t.pollingStation.name.substring(0, 30),
        t.pollingStation.municipality.name,
        t.votesCandidate?.toLocaleString('es-CO') || '0',
        t.totalVotes?.toLocaleString('es-CO') || '0',
        t.witness?.voter.name.substring(0, 20) || 'N/A',
        t.isValidated ? '✓' : '-'
      ])

    autoTable(doc, {
      startY: yPos,
      head: [['Mesa', 'Puesto', 'Municipio', 'Votos', 'Total', 'Testigo', 'Val.']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], fontSize: 7, fontStyle: 'bold' },
      styles: { fontSize: 6, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 45 },
        2: { cellWidth: 30 },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 20 },
        5: { cellWidth: 35 },
        6: { halign: 'center', cellWidth: 12 }
      }
    })
  }

  // Footer en todas las páginas
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Página ${i} de ${pageCount}`,
      105,
      287,
      { align: 'center' }
    )
    doc.text(
      'Sistema de Gestión Electoral - Resultados en Tiempo Real',
      105,
      292,
      { align: 'center' }
    )
  }

  // Guardar PDF
  const fileName = `Resultados_Electorales_${now.toISOString().split('T')[0]}_${now.getHours()}-${now.getMinutes()}.pdf`
  doc.save(fileName)
  
  return fileName
}
