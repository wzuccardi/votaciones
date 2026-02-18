import { useQuery } from '@tanstack/react-query'

interface Leader {
    id: string
    name: string
    document: string
    candidateId: string
    candidate: {
        id: string
        name: string
        party: string
    }
    _count: {
        voters: number
        subLeaders: number
    }
}

async function fetchLeaders(candidateId?: string | null): Promise<Leader[]> {
    const url = candidateId 
        ? `/api/data/leaders?candidateId=${candidateId}`
        : '/api/data/leaders'
    
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error('Failed to fetch leaders')
    }
    const data = await response.json()
    // El endpoint ahora retorna directamente el array
    return Array.isArray(data) ? data : []
}

export function useLeaders(candidateId?: string | null) {
    return useQuery({
        queryKey: ['leaders', candidateId],
        queryFn: () => fetchLeaders(candidateId),
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}
