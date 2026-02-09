import { useQuery } from '@tanstack/react-query'

interface Municipality {
    id: string
    name: string
    code: string
}

async function fetchMunicipalities(): Promise<Municipality[]> {
    const response = await fetch('/api/data/municipalities')
    if (!response.ok) {
        throw new Error('Failed to fetch municipalities')
    }
    const data = await response.json()
    return data.success ? data.data : []
}

export function useMunicipalities() {
    return useQuery({
        queryKey: ['municipalities'],
        queryFn: fetchMunicipalities,
        staleTime: 30 * 60 * 1000, // 30 minutos - los municipios casi nunca cambian
    })
}
