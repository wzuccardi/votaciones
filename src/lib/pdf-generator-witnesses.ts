import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface WitnessData {
  id: string
  voter: {
    name: string
    document: string
    celular?: string
    tel?: string
    email?: string
  }
  leader?: {
    name: string
    document: string
  }
  pollingStation: {
    name: string
    code: string
    address?: string
    community?: string
  }
  assignedTables: number[]
  status: string
  experience: string
  availability: string
  hasTransport: boolean
  emergencyContact?: string
  uniqueCode?: string
  confirmedAttendance: boolean
  receivedCredential: boolean
  arrivedAtStation: boolean
  reportedVotingStart: boolean
  reportedVotingEnd: boolean
  deliveredAct: boolean
}

// Función para agregar header con foto
async function addHeaderWithPhoto(doc: jsPDF, title: string) {
  const primaryBlue = [37, 99, 235]
  
  // Header background
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2])
  doc.rect(0, 0, 210, 50, 'F')
  
  // Intentar agregar foto
  try {
    const img = new Image()
    img.src = '/alonso-del-rio.jpg'
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      setTimeout(reject, 2000)
    })
    
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(img, 0, 0)
      const imgData = canvas.toDataURL('image/jpeg')
      doc.addImage(imgData, 'JPEG', 15, 8, 25, 25)
      
      // Badge 103
      doc.setFillColor(255, 255, 255)
      doc.circle(38, 31, 5, 'F')
      doc.setFontSize(8)
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2])
      doc.setFont('helvetica', 'bold')
      doc.text('103', 38, 32.5, { align: 'center' })
    }
  } catch (e) {
    console.log('No se pudo cargar la imagen del candidato')
  }
  
  // Textos
  doc.setFontSize(24)
  doc.setTextColor(255, 255, 255)
  doc.text(title, 120, 18, { align: 'center' })
  
  doc.setFontSize(14)
  doc.text('Alonso del Río - Cámara 103', 120, 28, { align: 'center' })
  doc.setFontSize(11)
  doc.text('Partido Conservador - Es Confianza', 120, 35, { align: 'center' })
}

/**
 * Plan de Testigos Electorales
 * Documento completo para imprimir y usar el día de elecciones
 */
export async function generateWitnessPlan(
  witnesses: WitnessData[],
  candidateName: string
) {
  const doc = new jsPDF()
  
  // Colors
  const primaryBlue = [37, 99, 235]
  const lightBlue = [219, 234, 254]
  const darkGray = [55, 65, 81]
  const greenAccent = [34, 197, 94]
  
  // Header
  await addHeaderWithPhoto(doc, 'Plan de Testigos Electorales')
  
  // Fecha
  const fecha = new Date().toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Fecha de generación: ${fecha}`, 105, 45, { align: 'center' })
  
  // Resumen ejecutivo
  let yPos = 60
  doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2])
  doc.rect(14, yPos, 182, 25, 'F')
  
  doc.setFontSize(14)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen Ejecutivo', 105, yPos + 7, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total de Testigos: ${witnesses.length}`, 105, yPos + 14, { align: 'center' })
  
  const confirmedCount = witnesses.filter(w => w.confirmedAttendance).length
  doc.text(`Confirmados: ${confirmedCount} (${Math.round((confirmedCount/witnesses.length)*100)}%)`, 105, yPos + 20, { align: 'center' })
  
  yPos += 35
  
  // Instrucciones generales
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Instrucciones para el Día Electoral', 14, yPos)
  yPos += 7
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const instructions = [
    '1. Llegar al puesto asignado a las 7:00 AM',
    '2. Presentarse con el coordinador del puesto',
    '3. Ubicarse cerca de las mesas asignadas',
    '4. Reportar cualquier irregularidad inmediatamente',
    '5. Permanecer hasta el cierre y conteo de votos',
    '6. Solicitar copia del acta de escrutinio'
  ]
  
  instructions.forEach(instruction => {
    doc.text(instruction, 14, yPos)
    yPos += 5
  })
  
  yPos += 10
  
  // Contactos de emergencia
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Contactos de Emergencia', 14, yPos)
  yPos += 7
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Coordinador General: [Agregar número]', 14, yPos)
  yPos += 5
  doc.text('Asesor Jurídico: [Agregar número]', 14, yPos)
  yPos += 5
  doc.text('Línea de Emergencia: 123', 14, yPos)
  
  // Nueva página para lista de testigos
  doc.addPage()
  yPos = 20
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Lista Completa de Testigos', 14, yPos)
  yPos += 10
  
  // Agrupar testigos por puesto
  const witnessesByStation = witnesses.reduce((acc, witness) => {
    const stationName = witness.pollingStation.name
    if (!acc[stationName]) {
      acc[stationName] = []
    }
    acc[stationName].push(witness)
    return acc
  }, {} as Record<string, WitnessData[]>)
  
  // Generar tabla por cada puesto
  Object.entries(witnessesByStation).forEach(([stationName, stationWitnesses]) => {
    // Verificar espacio en página
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2])
    doc.text(`📍 ${stationName}`, 14, yPos)
    yPos += 2
    
    const tableData = stationWitnesses.map(w => [
      w.voter.name,
      w.voter.document,
      w.assignedTables.join(', '),
      w.voter.celular || w.voter.tel || 'N/A',
      w.confirmedAttendance ? '✓' : '⬜',
      w.uniqueCode || 'N/A'
    ])
    
    autoTable(doc, {
      startY: yPos + 3,
      head: [['Nombre', 'Cédula', 'Mesas', 'Teléfono', 'Conf.', 'Código']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 8,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        // Colorear columna de confirmación
        if (data.column.index === 4 && data.section === 'body') {
          if (data.cell.text[0] === '✓') {
            data.cell.styles.textColor = [34, 197, 94]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 10
  })
  
  // Footer en todas las páginas
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.5)
    doc.line(14, doc.internal.pageSize.getHeight() - 15, 196, doc.internal.pageSize.getHeight() - 15)
    
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Plan de Testigos - Alonso del Río | Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
  
  // Descargar
  doc.save(`Plan_Testigos_Electorales_${Date.now()}.pdf`)
}


/**
 * Reporte de Cobertura General
 * Análisis completo de cobertura de testigos por todos los puestos
 */
export async function generateCoverageReport(
  witnesses: WitnessData[],
  allPollingStations: any[],
  candidateName: string
) {
  const doc = new jsPDF()
  
  // Colors
  const primaryBlue = [37, 99, 235]
  const lightBlue = [219, 234, 254]
  const darkGray = [55, 65, 81]
  const greenAccent = [34, 197, 94]
  const redAccent = [239, 68, 68]
  const yellowAccent = [234, 179, 8]
  
  // Header
  await addHeaderWithPhoto(doc, 'Reporte de Cobertura General')
  
  // Fecha
  const fecha = new Date().toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Fecha de generación: ${fecha}`, 105, 45, { align: 'center' })
  
  // Estadísticas globales
  let yPos = 60
  doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2])
  doc.rect(14, yPos, 182, 30, 'F')
  
  doc.setFontSize(14)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFont('helvetica', 'bold')
  doc.text('Estadísticas Globales', 105, yPos + 7, { align: 'center' })
  
  // Calcular estadísticas
  const totalStations = allPollingStations.length
  const stationsWithWitness = new Set(witnesses.map(w => w.pollingStation.name)).size
  const coveragePercent = totalStations > 0 ? Math.round((stationsWithWitness / totalStations) * 100) : 0
  
  // Calcular total de mesas cubiertas
  const totalTablesCovered = witnesses.reduce((sum, w) => sum + w.assignedTables.length, 0)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total de Testigos: ${witnesses.length}`, 105, yPos + 14, { align: 'center' })
  doc.text(`Puestos Cubiertos: ${stationsWithWitness} de ${totalStations} (${coveragePercent}%)`, 105, yPos + 20, { align: 'center' })
  doc.text(`Total de Mesas Asignadas: ${totalTablesCovered}`, 105, yPos + 26, { align: 'center' })
  
  yPos += 40
  
  // Indicador de cobertura
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Nivel de Cobertura', 14, yPos)
  yPos += 7
  
  let coverageColor = redAccent
  let coverageLabel = '🔴 Crítico (< 60%)'
  if (coveragePercent >= 80) {
    coverageColor = greenAccent
    coverageLabel = '🟢 Excelente (≥ 80%)'
  } else if (coveragePercent >= 60) {
    coverageColor = yellowAccent
    coverageLabel = '🟡 Aceptable (60-79%)'
  }
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(coverageColor[0], coverageColor[1], coverageColor[2])
  doc.text(coverageLabel, 14, yPos)
  yPos += 10
  
  // Análisis por puesto
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Cobertura por Puesto de Votación', 14, yPos)
  yPos += 5
  
  // Crear mapa de testigos por puesto
  const witnessesByStation = witnesses.reduce((acc, witness) => {
    const stationId = witness.pollingStation.name
    if (!acc[stationId]) {
      acc[stationId] = []
    }
    acc[stationId].push(witness)
    return acc
  }, {} as Record<string, WitnessData[]>)
  
  // Crear tabla de cobertura
  const coverageData = allPollingStations.map(station => {
    const stationWitnesses = witnessesByStation[station.name] || []
    const witnessCount = stationWitnesses.length
    const tablesCount = stationWitnesses.reduce((sum, w) => sum + w.assignedTables.length, 0)
    
    // Obtener nombres de testigos, líderes y mesas asignadas
    let witnessNames = 'Sin asignar'
    let leaderNames = '-'
    let mesasAsignadas = '-'
    
    if (stationWitnesses.length > 0) {
      // Crear lista detallada: "Nombre (Mesas: 1,2)"
      witnessNames = stationWitnesses.map(w => 
        `${w.voter.name} (${w.assignedTables.join(',')})`
      ).join('; ')
      
      leaderNames = stationWitnesses.map(w => (w as any).leader?.name || 'N/A').join(', ')
      
      // Lista de todas las mesas asignadas
      const allTables = stationWitnesses.flatMap(w => w.assignedTables).sort((a, b) => a - b)
      mesasAsignadas = allTables.join(', ')
    }
    
    const status = witnessCount > 0 ? '✓ Cubierto' : '✗ Sin cobertura'
    
    return [
      station.name,
      station.community || 'N/A',
      witnessNames,
      leaderNames,
      mesasAsignadas,
      status
    ]
  })
  
  // Ordenar por estado (sin cobertura primero)
  coverageData.sort((a, b) => {
    if (a[5] === '✗ Sin cobertura' && b[5] !== '✗ Sin cobertura') return -1
    if (a[5] !== '✗ Sin cobertura' && b[5] === '✗ Sin cobertura') return 1
    return 0
  })
  
  autoTable(doc, {
    startY: yPos + 3,
    head: [['Puesto', 'Zona', 'Testigo (Mesas)', 'Líder', 'Mesas', 'Estado']],
    body: coverageData,
    theme: 'grid',
    headStyles: { 
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 7,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Puesto
      1: { cellWidth: 20 }, // Zona
      2: { cellWidth: 50 }, // Testigo (Mesas)
      3: { cellWidth: 30 }, // Líder
      4: { cellWidth: 20 }, // Mesas
      5: { cellWidth: 25 }  // Estado
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    didParseCell: (data) => {
      // Colorear columna de estado
      if (data.column.index === 5 && data.section === 'body') {
        if (data.cell.text[0] === '✓ Cubierto') {
          data.cell.styles.textColor = [34, 197, 94]
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = [239, 68, 68]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    }
  })
  
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 50
  
  // Nueva página para brechas críticas
  if (finalY > 220) {
    doc.addPage()
    yPos = 20
  } else {
    yPos = finalY + 15
  }
  
  // Brechas críticas
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Brechas Críticas', 14, yPos)
  yPos += 7
  
  // Puestos sin cobertura
  const stationsWithoutCoverage = allPollingStations.filter(
    station => !witnessesByStation[station.name]
  )
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(redAccent[0], redAccent[1], redAccent[2])
  doc.text(`🔴 Puestos sin Testigos: ${stationsWithoutCoverage.length}`, 14, yPos)
  yPos += 7
  
  if (stationsWithoutCoverage.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    
    stationsWithoutCoverage.slice(0, 10).forEach(station => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      doc.text(`  • ${station.name} (${station.community || 'Sin zona'})`, 14, yPos)
      yPos += 5
    })
    
    if (stationsWithoutCoverage.length > 10) {
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text(`  ... y ${stationsWithoutCoverage.length - 10} más`, 14, yPos)
      yPos += 5
    }
  }
  
  yPos += 5
  
  // Testigos sobrecargados
  const overloadedWitnesses = witnesses.filter(w => w.assignedTables.length > 5)
  
  if (overloadedWitnesses.length > 0) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(yellowAccent[0], yellowAccent[1], yellowAccent[2])
    doc.text(`🟡 Testigos Sobrecargados (>5 mesas): ${overloadedWitnesses.length}`, 14, yPos)
    yPos += 7
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    
    overloadedWitnesses.forEach(witness => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      doc.text(`  • ${witness.voter.name}: ${witness.assignedTables.length} mesas`, 14, yPos)
      yPos += 5
    })
  }
  
  yPos += 10
  
  // Recomendaciones
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Recomendaciones', 14, yPos)
  yPos += 7
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const recommendations: string[] = []
  if (coveragePercent < 60) {
    recommendations.push('🔴 Prioridad ALTA: Asignar testigos a puestos sin cobertura')
  }
  if (stationsWithoutCoverage.length > 0) {
    recommendations.push(`📍 Enfocar esfuerzos en ${stationsWithoutCoverage.length} puestos sin testigos`)
  }
  if (overloadedWitnesses.length > 0) {
    recommendations.push(`⚖️ Redistribuir carga de ${overloadedWitnesses.length} testigos sobrecargados`)
  }
  if (coveragePercent >= 80) {
    recommendations.push('✅ Excelente cobertura - Mantener y confirmar asistencia')
  }
  
  recommendations.forEach(rec => {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    doc.text(rec, 14, yPos)
    yPos += 6
  })
  
  // Footer en todas las páginas
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.5)
    doc.line(14, doc.internal.pageSize.getHeight() - 15, 196, doc.internal.pageSize.getHeight() - 15)
    
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Reporte de Cobertura - Alonso del Río | Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
  
  // Descargar
  doc.save(`Reporte_Cobertura_General_${Date.now()}.pdf`)
}
