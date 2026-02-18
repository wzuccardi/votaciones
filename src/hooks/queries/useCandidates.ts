import { useQuery } from '@tanstack/react-query'

interface Candidate {
    id: string
    name: string
    party: string
    document: string
    primaryColor?: string
    secondaryColor?: string
    logoUrl?: string
    photoUrl?: string
    _count: {
        leaders: number
    }
}

async function fetchCandidates(): Promise<Candidate[]> {
    const response = await fetch('/api/data/candidates')
    if (!response.ok) {
        throw new Error('Failed to fetch candidates')
    }
    const data = await response.json()
    // El endpoint ahora retorna directamente el array
    return Array.isArray(data) ? data : []
}

export function useCandidates() {
    return useQuery({
        queryKey: ['candidates'],
        queryFn: fetchCandidates,
        staleTime: 10 * 60 * 1000, // 10 minutos - los candidatos no cambian frecuentemente
    })
}
