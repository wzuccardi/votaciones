interface Stat {
    value: number | string
    label: string
}

interface StatsPanelProps {
    stats: Stat[]
}

export function StatsPanel({ stats }: StatsPanelProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20"
                >
                    <div className="text-2xl md:text-3xl font-bold text-primary">
                        {stat.value}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">
                        {stat.label}
                    </div>
                </div>
            ))}
        </div>
    )
}
