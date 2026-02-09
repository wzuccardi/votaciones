import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Servidor Pusher (para usar en API routes)
export const pusherServer = process.env.PUSHER_APP_ID
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID!,
        key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
        secret: process.env.PUSHER_SECRET!,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        useTLS: true,
    })
    : null

// Cliente Pusher (para usar en componentes del cliente)
export const pusherClient =
    typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_PUSHER_KEY &&
        process.env.NEXT_PUBLIC_PUSHER_CLUSTER
        ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        })
        : null

// Eventos disponibles
export const PusherEvents = {
    VOTE_REPORTED: 'vote-reported',
    WITNESS_ASSIGNED: 'witness-assigned',
    TABLE_UPDATED: 'table-updated',
    NEW_VOTER: 'new-voter',
} as const

// Canales por tipo de usuario
export function getCandidateChannel(candidateId: string) {
    return `private-candidate-${candidateId}`
}

export function getLeaderChannel(leaderId: string) {
    return `private-leader-${leaderId}`
}

export function getPublicChannel() {
    return 'public-updates'
}
