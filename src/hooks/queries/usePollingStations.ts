import { useQuery } from '@tanstack/react-query'

interface PollingStation {
    id: string
    name: string
    code: string
    community?: string
}

async function fetchPollingStations(municipalityId: string): Promise<PollingStation[]> {
    const response = await fetch(`/api/data/polling-stations?municipalityId=${municipalityId}`)
    if (!response.ok) {
        throw new Error('Failed to fetch polling stations')
    }
    const data = await response.json()
    return data.success ? data.data : []
}

async function fetchAllPollingStations(): Promise<PollingStation[]> {
    const response = await fetch('/api/data/polling-stations')
    if (!response.ok) {
        throw new Error('Failed to fetch polling stations')
    }
    const data = await response.json()
    return data.success ? data.data : []
}

export function usePollingStations(municipalityId?: string | null) {
    return useQuery({
        queryKey: municipalityId ? ['pollingStations', municipalityId] : ['pollingStations', 'all'],
        queryFn: () => municipalityId ? fetchPollingStations(municipalityId) : fetchAllPollingStations(),
        enabled: municipalityId !== undefined, // Solo ejecuta si municipalityId está definido (puede ser null para todos)
        staleTime: 15 * 60 * 1000, // 15 minutos
    })
}
