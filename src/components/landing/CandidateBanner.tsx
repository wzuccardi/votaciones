import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'

interface CandidateBannerProps {
    name?: string
    position?: string
    party?: string
    photoUrl?: string
    logoUrl?: string
    department?: string
}

export function CandidateBanner({
    name = 'Alonso del Río',
    position = 'Cámara 103 - Es Confianza',
    party = 'Partido Conservador Colombiano',
    photoUrl = '/alonso-del-rio.jpg',
    department = 'Bolívar'
}: CandidateBannerProps) {
    return (
        <div className="mb-12 bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-2xl border-2 border-primary/20 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 items-center p-8">
                <div className="order-2 md:order-1 space-y-4">
                    <Badge variant="outline" className="mb-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        Elecciones Cámara 2026
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold">{name}</h2>
                    <p className="text-xl text-primary font-semibold">{position}</p>
                    <p className="text-muted-foreground">{party}</p>
                    <div className="flex flex-wrap gap-2 pt-4">
                        <Badge className="bg-blue-600 hover:bg-blue-700">Experiencia</Badge>
                        <Badge className="bg-blue-600 hover:bg-blue-700">Compromiso</Badge>
                        <Badge className="bg-blue-600 hover:bg-blue-700">{department}</Badge>
                    </div>
                </div>
                <div className="order-1 md:order-2 flex justify-center">
                    <div className="relative">
                        <img
                            src={photoUrl}
                            alt={`${name} - Candidato`}
                            className="w-64 h-64 md:w-80 md:h-80 rounded-2xl object-cover border-4 border-primary/30 shadow-2xl"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                            }}
                        />
                        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold text-lg shadow-lg">
                            103
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
