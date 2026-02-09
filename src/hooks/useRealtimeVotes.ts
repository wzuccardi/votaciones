import { useEffect, useState } from 'react'
import { pusherClient, getCandidateChannel, PusherEvents } from '@/lib/pusher'

interface VoteUpdate {
    tableId: string
    pollingStationId: string
    votesCandidate: number
    totalVotes: number
    timestamp: number
}

export function useRealtimeVotes(candidateId: string | null | undefined) {
    const [latestUpdate, setLatestUpdate] = useState<VoteUpdate | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        if (!candidateId || !pusherClient) {
            return
        }

        const channel = pusherClient.subscribe(getCandidateChannel(candidateId))

        // Listener para estado de conexión
        pusherClient.connection.bind('connected', () => {
            setIsConnected(true)
        })

        pusherClient.connection.bind('disconnected', () => {
            setIsConnected(false)
        })

        // Listener para actualizaciones de votos
        channel.bind(PusherEvents.VOTE_REPORTED, (data: VoteUpdate) => {
            setLatestUpdate(data)
        })

        return () => {
            channel.unbind(PusherEvents.VOTE_REPORTED)
            if (pusherClient) {
                pusherClient.unsubscribe(getCandidateChannel(candidateId))
            }
        }
    }, [candidateId])

    return {
        latestUpdate,
        isConnected,
        isEnabled: !!pusherClient
    }
}
