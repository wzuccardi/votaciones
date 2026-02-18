import { useQuery } from '@tanstack/react-query'

interface Municipality {
    id: string
    name: string
    code: string
    departmentId: string
    department: {
        name: string
        code: string
    }
    _count: {
        pollingStations: number
    }
}

async function fetchMunicipalities(departmentId?: string | null): Promise<Municipality[]> {
    const url = departmentId 
        ? `/api/data/municipalities?departmentId=${departmentId}`
        : '/api/data/municipalities'
    
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error('Failed to fetch municipalities')
    }
    const data = await response.json()
    
    // El endpoint ahora retorna directamente el array
    return Array.isArray(data) ? data : []
}

export function useMunicipalities(departmentId?: string | null) {
    return useQuery({
        queryKey: ['municipalities', departmentId],
        queryFn: () => fetchMunicipalities(departmentId),
        staleTime: 30 * 60 * 1000, // 30 minutos - los municipios casi nunca cambian
    })
}
