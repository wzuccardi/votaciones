import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface Feature {
    text: string
}

interface RoleCardProps {
    icon: LucideIcon
    title: string
    description: string
    badge: string
    features: Feature[]
    onClick?: () => void
    children?: ReactNode
}

export function RoleCard({
    icon: Icon,
    title,
    description,
    badge,
    features,
    onClick,
    children
}: RoleCardProps) {
    return (
        <Card
            className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 hover:border-primary/50 cursor-pointer h-full"
            onClick={onClick}
        >
            <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">{badge}</Badge>
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
                            <span>{feature.text}</span>
                        </div>
                    ))}
                </div>
                {children}
            </CardContent>
        </Card>
    )
}
