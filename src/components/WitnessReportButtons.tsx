'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Download, Loader2, Users, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { generateWitnessPlan, generateCoverageReport } from '@/lib/pdf-generator-witnesses'

interface WitnessReportButtonsProps {
  leaderId?: string
  candidateId?: string
  candidateName: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}

export function WitnessReportButtons({
  leaderId,
  candidateId,
  candidateName,
  variant = 'default',
  size = 'default'
}: WitnessReportButtonsProps) {
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [generatingCoverage, setGeneratingCoverage] = useState(false)

  const handleGeneratePlan = async () => {
    try {
      setGeneratingPlan(true)
      toast.info('Generando plan de testigos...')

      // Construir URL según el rol
      const url = leaderId
        ? `/api/dashboard/leader/witnesses?leaderId=${leaderId}`
        : `/api/dashboard/candidate/witnesses?candidateId=${candidateId}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success && data.data.length > 0) {
        await generateWitnessPlan(data.data, candidateName)
        toast.success('Plan de testigos generado exitosamente')
      } else {
        toast.warning('No hay testigos asignados para generar el plan')
      }
    } catch (error) {
      console.error('Error generating plan:', error)
      toast.error('Error al generar el plan de testigos')
    } finally {
      setGeneratingPlan(false)
    }
  }

  const handleGenerateCoverage = async () => {
    try {
      setGeneratingCoverage(true)
      toast.info('Generando reporte de cobertura...')

      // Obtener testigos
      const witnessUrl = leaderId
        ? `/api/dashboard/leader/witnesses?leaderId=${leaderId}`
        : `/api/dashboard/candidate/witnesses?candidateId=${candidateId}`

      const witnessResponse = await fetch(witnessUrl)
      const witnessData = await witnessResponse.json()

      // Obtener todos los puestos de votación
      const stationsResponse = await fetch('/api/data/polling-stations')
      const stationsData = await stationsResponse.json()

      if (witnessData.success && stationsData.success) {
        await generateCoverageReport(
          witnessData.data,
          stationsData.data,
          candidateName
        )
        toast.success('Reporte de cobertura generado exitosamente')
      } else {
        toast.error('Error al obtener datos para el reporte')
      }
    } catch (error) {
      console.error('Error generating coverage:', error)
      toast.error('Error al generar el reporte de cobertura')
    } finally {
      setGeneratingCoverage(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={handleGeneratePlan}
        disabled={generatingPlan}
        variant={variant}
        size={size}
      >
        {generatingPlan ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Users className="mr-2 h-4 w-4" />
            Plan de Testigos
          </>
        )}
      </Button>

      <Button
        onClick={handleGenerateCoverage}
        disabled={generatingCoverage}
        variant={variant}
        size={size}
      >
        {generatingCoverage ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <BarChart3 className="mr-2 h-4 w-4" />
            Reporte de Cobertura
          </>
        )}
      </Button>
    </div>
  )
}
