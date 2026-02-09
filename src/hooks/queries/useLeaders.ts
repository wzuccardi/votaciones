import { useQuery } from '@tanstack/react-query'

interface Leader {
    id: string
    name: string
    candidate?: {
        party: string
    }
}

async function fetchLeaders(): Promise<Leader[]> {
    const response = await fetch('/api/data/leaders')
    if (!response.ok) {
        throw new Error('Failed to fetch leaders')
    }
    const data = await response.json()
    return data.success ? data.data : []
}

export function useLeaders() {
    return useQuery({
        queryKey: ['leaders'],
        queryFn: fetchLeaders,
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}
