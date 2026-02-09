import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Voter {
  id: string
  document: string
  name: string
  tel?: string
  celular?: string
  email?: string
  municipality?: string
  pollingStation?: string
  tableNumber?: string
}

interface Leader {
  id: string
  name: string
  document: string
  _count?: {
    voters: number
  }
}

interface ReportData {
  candidateName: string
  candidateParty?: string
  totalLeaders: number
  totalVoters: number
  leaders: Leader[]
  voters: Voter[]
  logoUrl?: string
}

// Función para cargar imagen y convertirla a base64
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/jpeg'))
      } else {
        reject(new Error('Could not get canvas context'))
      }
    }
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = url
  })
}

// Función para agregar header con foto
async function addHeaderWithPhoto(doc: jsPDF, title: string) {
  const primaryBlue = [37, 99, 235]
  
  // Header background
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2])
  doc.rect(0, 0, 210, 50, 'F')
  
  // Intentar agregar foto
  try {
    const imgData = await loadImageAsBase64('/alonso-del-rio.jpg')
    doc.addImage(imgData, 'JPEG', 15, 8, 25, 25)
    
    // Badge 103
    doc.setFillColor(255, 255, 255)
    doc.circle(38, 31, 5, 'F')
    doc.setFontSize(8)
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2])
    doc.setFont('helvetica', 'bold')
    doc.text('103', 38, 32.5, { align: 'center' })
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

// Función auxiliar para agregar el header con imagen del candidato
async function addCandidateHeader(doc: jsPDF, title: string, subtitle?: string) {
  try {
    // Intentar cargar la imagen del candidato
    const img = new Image()
    img.src = '/alonso-del-rio.jpg'
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      // Timeout de 2 segundos
      setTimeout(reject, 2000)
    })
    
    // Agregar imagen en la esquina superior izquierda
    doc.addImage(img, 'JPEG', 14, 10, 25, 25)
    
    // Badge "103" junto a la imagen
    doc.setFillColor(37, 99, 235) // Azul primario
    doc.roundedRect(41, 32, 12, 6, 1, 1, 'F')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('103', 47, 36, { align: 'center' })
    
    // Título del reporte
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 105, 20, { align: 'center' })
    
    // Información del candidato
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text('Alonso del Río - Cámara 103', 105, 28, { align: 'center' })
    doc.setFontSize(10)
    doc.text('Partido Conservador - Es Confianza', 105, 34, { align: 'center' })
    
    if (subtitle) {
      doc.setFontSize(11)
      doc.setTextColor(80, 80, 80)
      doc.text(subtitle, 105, 40, { align: 'center' })
    }
    
    return 45 // Retorna la posición Y donde termina el header
  } catch (error) {
    // Si falla la carga de imagen, usar header sin imagen
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text('Alonso del Río - Cámara 103', 105, 28, { align: 'center' })
    doc.setFontSize(10)
    doc.text('Partido Conservador - Es Confianza', 105, 34, { align: 'center' })
    
    if (subtitle) {
      doc.setFontSize(11)
      doc.setTextColor(80, 80, 80)
      doc.text(subtitle, 105, 40, { align: 'center' })
    }
    
    return 45
  }
}

export function generateGeneralReport(data: ReportData) {
  const doc = new jsPDF()
  
  // Colors
  const primaryBlue = [37, 99, 235]
  const lightBlue = [219, 234, 254]
  const darkGray = [55, 65, 81]
  
  // Header with branding
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2])
  doc.rect(0, 0, 210, 45, 'F')
  
  doc.setFontSize(24)
  doc.setTextColor(255, 255, 255)
  doc.text('Reporte General de Campaña', 105, 15, { align: 'center' })
  
  doc.setFontSize(14)
  doc.text('Alonso del Río - Cámara 103', 105, 25, { align: 'center' })
  doc.setFontSize(11)
  doc.text('Partido Conservador - Es Confianza', 105, 32, { align: 'center' })
  
  // Fecha
  const fecha = new Date().toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  doc.setFontSize(9)
  doc.text(`Fecha de generación: ${fecha}`, 105, 39, { align: 'center' })
  
  // Estadísticas en cajas
  doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2])
  doc.rect(14, 55, 88, 25, 'F')
  doc.rect(108, 55, 88, 25, 'F')
  
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Total de Líderes', 58, 63, { align: 'center' })
  doc.text('Total de Votantes', 152, 63, { align: 'center' })
  
  doc.setFontSize(24)
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2])
  doc.text(data.totalLeaders.toString(), 58, 75, { align: 'center' })
  doc.text(data.totalVoters.toString(), 152, 75, { align: 'center' })
  
  // Tabla de Líderes
  doc.setFontSize(16)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFont('helvetica', 'bold')
  doc.text('Líderes de Campaña', 14, 95)
  
  const leadersData = data.leaders.map(leader => [
    leader.name,
    leader.document,
    (leader._count?.voters || 0).toString()
  ])
  
  autoTable(doc, {
    startY: 100,
    head: [['Nombre', 'Cédula', 'Votantes']],
    body: leadersData,
    theme: 'grid',
    headStyles: { 
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  })
  
  const finalY = (doc as any).lastAutoTable.finalY || 100
  
  // Nueva página para votantes si es necesario
  if (finalY > 200) {
    doc.addPage()
    doc.setFontSize(16)
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    doc.setFont('helvetica', 'bold')
    doc.text('Lista de Votantes', 14, 20)
  } else {
    doc.setFontSize(16)
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    doc.setFont('helvetica', 'bold')
    doc.text('Lista de Votantes', 14, finalY + 15)
  }
  
  const votersData = data.voters.slice(0, 100).map(voter => [
    voter.name,
    voter.document,
    voter.municipality || 'N/A',
    voter.celular || voter.tel || 'N/A'
  ])
  
  autoTable(doc, {
    startY: finalY > 200 ? 25 : finalY + 20,
    head: [['Nombre', 'Cédula', 'Municipio', 'Teléfono']],
    body: votersData,
    theme: 'grid',
    headStyles: { 
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  })
  
  if (data.voters.length > 100) {
    const finalY2 = (doc as any).lastAutoTable.finalY
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(`Mostrando 100 de ${data.voters.length} votantes`, 14, finalY2 + 10)
  }
  
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
      `Alonso del Río - Cámara 103 | Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
  
  // Descargar
  doc.save(`Reporte_General_${data.candidateName.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
}

export async function generateLeaderReport(leaderName: string, leaderDocument: string, voters: Voter[], candidateName: string) {
  const doc = new jsPDF()
  
  // Colors
  const primaryBlue = [37, 99, 235]
  const lightBlue = [219, 234, 254]
  const darkGray = [55, 65, 81]
  
  // Header with photo
  await addHeaderWithPhoto(doc, 'Reporte de Líder')
  
  // Leader info box
  doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2])
  doc.rect(14, 55, 182, 25, 'F')
  
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Líder: ${leaderName}`, 20, 63)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Cédula: ${leaderDocument}`, 20, 70)
  doc.text(`Candidato: ${candidateName}`, 20, 77)
  
  // Fecha
  const fecha = new Date().toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Fecha de generación: ${fecha}`, 105, 88, { align: 'center' })
  
  // Estadísticas
  doc.setFontSize(16)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFont('helvetica', 'bold')
  doc.text('Estadísticas', 14, 100)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total de Votantes: ${voters.length}`, 14, 110)
  
  // Agrupar por municipio
  const votersByMunicipality = voters.reduce((acc, voter) => {
    const mun = voter.municipality || 'Sin municipio'
    acc[mun] = (acc[mun] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  let yPos = 117
  doc.setFont('helvetica', 'bold')
  doc.text('Distribución por Municipio:', 14, yPos)
  yPos += 7
  
  doc.setFont('helvetica', 'normal')
  Object.entries(votersByMunicipality).forEach(([mun, count]) => {
    doc.setFontSize(10)
    doc.text(`  • ${mun}: ${count} votante${count !== 1 ? 's' : ''}`, 14, yPos)
    yPos += 6
  })
  
  // Tabla de Votantes
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Lista de Votantes', 14, yPos + 10)
  
  const votersData = voters.map(voter => [
    voter.name,
    voter.document,
    voter.municipality || 'N/A',
    voter.pollingStation || 'N/A',
    voter.celular || voter.tel || 'N/A'
  ])
  
  autoTable(doc, {
    startY: yPos + 15,
    head: [['Nombre', 'Cédula', 'Municipio', 'Puesto', 'Teléfono']],
    body: votersData,
    theme: 'grid',
    headStyles: { 
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    }
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
      `Alonso del Río - Cámara 103 | Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
  
  // Descargar
  const timestamp = Date.now()
  doc.save(`Reporte_Lider_${leaderName.replace(/\s+/g, '_')}_${timestamp}.pdf`)
}

export function generateMunicipalityReport(
  municipalityName: string, 
  voters: Voter[], 
  candidateName: string
) {
  const doc = new jsPDF()
  
  // Colors
  const primaryBlue = [37, 99, 235]
  const lightBlue = [219, 234, 254]
  const darkGray = [55, 65, 81]
  
  // Header with branding
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2])
  doc.rect(0, 0, 210, 45, 'F')
  
  doc.setFontSize(24)
  doc.setTextColor(255, 255, 255)
  doc.text('Reporte por Municipio', 105, 15, { align: 'center' })
  
  doc.setFontSize(14)
  doc.text('Alonso del Río - Cámara 103', 105, 25, { align: 'center' })
  doc.setFontSize(11)
  doc.text('Partido Conservador - Es Confianza', 105, 32, { align: 'center' })
  
  // Fecha
  const fecha = new Date().toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  doc.setFontSize(9)
  doc.text(`Fecha de generación: ${fecha}`, 105, 39, { align: 'center' })
  
  // Municipality info box
  doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2])
  doc.rect(14, 55, 182, 20, 'F')
  
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`Municipio: ${municipalityName}`, 105, 63, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total de Votantes: ${voters.length}`, 105, 71, { align: 'center' })
  
  // Agrupar por líder
  const votersByLeader = voters.reduce((acc, voter) => {
    const leader = (voter as any).leader?.name || 'Sin líder'
    acc[leader] = (acc[leader] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  let yPos = 85
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Distribución por Líder:', 14, yPos)
  yPos += 7
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  Object.entries(votersByLeader).forEach(([leader, count]) => {
    doc.text(`  • ${leader}: ${count} votante${count !== 1 ? 's' : ''}`, 14, yPos)
    yPos += 6
  })
  
  // Tabla de Votantes
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Lista de Votantes', 14, yPos + 10)
  
  const votersData = voters.map(voter => [
    voter.name,
    voter.document,
    voter.pollingStation || 'N/A',
    (voter as any).leader?.name || 'Sin líder',
    voter.celular || voter.tel || 'N/A'
  ])
  
  autoTable(doc, {
    startY: yPos + 15,
    head: [['Nombre', 'Cédula', 'Puesto', 'Líder', 'Teléfono']],
    body: votersData,
    theme: 'grid',
    headStyles: { 
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [245, 247, 250] }
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
      `Alonso del Río - Cámara 103 | Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
  
  // Descargar
  doc.save(`Reporte_Municipio_${municipalityName.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
}

interface PollingStationData {
  id: string
  name: string
  code: string
  address?: string
  community?: string
  municipality?: string
}

interface TableVoterCount {
  tableNumber: string
  voterCount: number
  voters: Voter[]
  hasWitness: boolean
  witnessName?: string
}

export async function generatePollingStationReport(
  pollingStation: PollingStationData,
  voters: Voter[],
  witnesses: any[],
  candidateName: string
) {
  const doc = new jsPDF()
  
  // Colors
  const primaryBlue = [37, 99, 235]
  const lightBlue = [219, 234, 254]
  const darkGray = [55, 65, 81]
  const greenAccent = [34, 197, 94]
  const redAccent = [239, 68, 68]
  
  // Header with branding
  await addHeaderWithPhoto(doc, 'Reporte por Puesto de Votación')
  
  // Polling Station info box
  doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2])
  doc.rect(14, 55, 182, 35, 'F')
  
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`${pollingStation.name}`, 105, 63, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Código: ${pollingStation.code}`, 105, 70, { align: 'center' })
  
  if (pollingStation.address) {
    doc.setFontSize(10)
    doc.text(`Dirección: ${pollingStation.address}`, 105, 76, { align: 'center' })
  }
  
  if (pollingStation.community) {
    doc.setFontSize(10)
    doc.text(`Zona: ${pollingStation.community}`, 105, 82, { align: 'center' })
  }
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total de Votantes: ${voters.length}`, 105, 88, { align: 'center' })
  
  // Fecha
  const fecha = new Date().toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Fecha de generación: ${fecha}`, 105, 95, { align: 'center' })
  
  // Agrupar votantes por mesa
  const votersByTable = voters.reduce((acc, voter) => {
    const tableNum = voter.tableNumber || 'Sin mesa'
    if (!acc[tableNum]) {
      acc[tableNum] = []
    }
    acc[tableNum].push(voter)
    return acc
  }, {} as Record<string, Voter[]>)
  
  // Crear array de mesas con conteo y ordenar de mayor a menor
  const tableData: TableVoterCount[] = Object.entries(votersByTable)
    .map(([tableNumber, tableVoters]) => {
      // Buscar si hay testigo asignado a esta mesa
      const witness = witnesses.find(w => 
        w.pollingStationId === pollingStation.id && 
        w.assignedTables?.includes(parseInt(tableNumber))
      )
      
      return {
        tableNumber,
        voterCount: tableVoters.length,
        voters: tableVoters,
        hasWitness: !!witness,
        witnessName: witness?.voter?.name
      }
    })
    .sort((a, b) => b.voterCount - a.voterCount) // Ordenar de mayor a menor
  
  // Estadísticas de cobertura
  let yPos = 105
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Cobertura de Testigos Electorales', 14, yPos)
  yPos += 7
  
  const tablesWithWitness = tableData.filter(t => t.hasWitness).length
  const totalTables = tableData.length
  const coveragePercent = totalTables > 0 ? Math.round((tablesWithWitness / totalTables) * 100) : 0
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`  • Mesas con testigo: ${tablesWithWitness} de ${totalTables} (${coveragePercent}%)`, 14, yPos)
  yPos += 6
  doc.text(`  • Mesas sin testigo: ${totalTables - tablesWithWitness}`, 14, yPos)
  yPos += 10
  
  // Tabla de Mesas ordenadas por número de votantes
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Mesas Ordenadas por Prioridad', 14, yPos)
  yPos += 5
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('(De mayor a menor número de votantes)', 14, yPos)
  
  const tableRows = tableData.map(table => [
    table.tableNumber,
    table.voterCount.toString(),
    table.hasWitness ? '✓ Sí' : '✗ No',
    table.witnessName || '-'
  ])
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Mesa', 'Votantes', 'Testigo', 'Nombre del Testigo']],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    didParseCell: (data) => {
      // Colorear la columna de testigo
      if (data.column.index === 2 && data.section === 'body') {
        const hasWitness = data.cell.text[0] === '✓ Sí'
        if (hasWitness) {
          data.cell.styles.textColor = [34, 197, 94] // Verde
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = [239, 68, 68] // Rojo
        }
      }
    }
  })
  
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 50
  
  // Nueva página si es necesario para el detalle de votantes
  if (finalY > 220) {
    doc.addPage()
    yPos = 20
  } else {
    yPos = finalY + 15
  }
  
  // Detalle de votantes por mesa (solo las 5 mesas con más votantes)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Detalle de Votantes - Top 5 Mesas', 14, yPos)
  yPos += 5
  
  const top5Tables = tableData.slice(0, 5)
  
  for (const table of top5Tables) {
    // Verificar si necesitamos nueva página
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    doc.text(`Mesa ${table.tableNumber} - ${table.voterCount} votante${table.voterCount !== 1 ? 's' : ''}`, 14, yPos)
    yPos += 5
    
    if (table.hasWitness) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(34, 197, 94)
      doc.text(`✓ Testigo asignado: ${table.witnessName}`, 14, yPos)
      yPos += 5
    }
    
    const voterRows = table.voters.map(v => [
      v.name,
      v.document,
      v.celular || v.tel || 'N/A'
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Nombre', 'Cédula', 'Teléfono']],
      body: voterRows,
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
      margin: { left: 14, right: 14 }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 8
  }
  
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
      `Alonso del Río - Cámara 103 | Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
  
  // Descargar
  doc.save(`Reporte_Puesto_${pollingStation.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
}
