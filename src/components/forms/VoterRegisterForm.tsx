'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { voterRegisterSchema, type VoterRegisterInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

interface VoterRegisterFormProps {
    leaders: Array<{ id: string; name: string; candidate?: { party: string } }>
    municipalities: Array<{ id: string; name: string }>
    onSuccess?: () => void
}

export function VoterRegisterForm({ leaders, municipalities, onSuccess }: VoterRegisterFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [pollingStations, setPollingStations] = useState<Array<{ id: string; name: string; code: string; community?: string }>>([])
    const [zones, setZones] = useState<string[]>([])
    const [selectedZone, setSelectedZone] = useState<string>('')
    const [filteredStations, setFilteredStations] = useState<typeof pollingStations>([])
    const [openPollingStation, setOpenPollingStation] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<VoterRegisterInput>({
        resolver: zodResolver(voterRegisterSchema),
    })

    const leaderId = watch('leaderId')
    const municipality = watch('municipality')
    const pollingStation = watch('pollingStation')

    // Cargar puestos de votación cuando se selecciona municipio
    useEffect(() => {
        const loadPollingStations = async () => {
            if (!municipality) {
                setPollingStations([])
                setZones([])
                return
            }

            const municipalityObj = municipalities.find(m => m.name === municipality)
            if (!municipalityObj) return

            try {
                const res = await fetch(`/api/data/polling-stations?municipalityId=${municipalityObj.id}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.success) {
                        setPollingStations(data.data || [])
                        const uniqueZones = Array.from(new Set((data.data || []).map((s: any) => s.community).filter(Boolean))) as string[]
                        setZones(uniqueZones)
                        setSelectedZone('')
                        setValue('pollingStation', '')
                    }
                }
            } catch (error) {
                console.error('Error loading polling stations:', error)
            }
        }

        loadPollingStations()
    }, [municipality, municipalities, setValue])

    // Filtrar puestos por zona
    useEffect(() => {
        if (selectedZone) {
            setFilteredStations(pollingStations.filter(s => s.community === selectedZone))
        } else {
            setFilteredStations(pollingStations)
        }
    }, [selectedZone, pollingStations])

    const onSubmit = async (data: VoterRegisterInput) => {
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, role: 'voter' })
            })

            const result = await response.json()

            if (response.ok) {
                toast.success('¡Votante registrado exitosamente!')
                reset()
                onSuccess?.()

                const voterId = result?.data?.id
                window.location.href = voterId ? `/dashboard/voter?voterId=${voterId}` : '/dashboard/voter'
            } else {
                if (result.alreadyLinked) {
                    toast.error(result.message || 'Documento ya vinculado a otra campaña')
                } else {
                    toast.error(result.error || 'Error al registrar votante')
                }
            }
        } catch (error) {
            toast.error('Error de conexión. Verifica tu internet.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
                <Label htmlFor="voter-document">Número de Cédula *</Label>
                <Input
                    id="voter-document"
                    type="text"
                    placeholder="Ej: 1234567890"
                    {...register('document')}
                    aria-invalid={!!errors.document}
                />
                {errors.document && (
                    <p className="text-sm text-destructive">{errors.document.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="voter-name">Nombre Completo *</Label>
                <Input
                    id="voter-name"
                    type="text"
                    placeholder="Ej: Carlos Rodríguez"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="voter-tel">Teléfono</Label>
                <Input
                    id="voter-tel"
                    type="text"
                    placeholder="Ej: 6011234567"
                    {...register('tel')}
                    aria-invalid={!!errors.tel}
                />
                {errors.tel && (
                    <p className="text-sm text-destructive">{errors.tel.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="voter-cel">Celular</Label>
                <Input
                    id="voter-cel"
                    type="text"
                    placeholder="Ej: 3001234567"
                    {...register('celular')}
                    aria-invalid={!!errors.celular}
                />
                {errors.celular && (
                    <p className="text-sm text-destructive">{errors.celular.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="voter-email">Correo Electrónico</Label>
                <Input
                    id="voter-email"
                    type="email"
                    placeholder="Ej: nombre@correo.com"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="voter-leader">Líder (Opcional)</Label>
                <Select
                    value={leaderId || 'none'}
                    onValueChange={(value) => setValue('leaderId', value === 'none' ? '' : value)}
                >
                    <SelectTrigger id="voter-leader">
                        <SelectValue placeholder="Selecciona un líder (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Registrarme sin líder</SelectItem>
                        {leaders.map((leader) => (
                            <SelectItem key={leader.id} value={leader.id}>
                                {leader.name} {leader.candidate ? `(${leader.candidate.party})` : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="voter-municipality">Municipio (Bolívar) *</Label>
                <Select
                    value={municipality}
                    onValueChange={(value) => {
                        const muni = municipalities.find(m => m.id === value)
                        setValue('municipality', muni?.name || '', { shouldValidate: true })
                    }}
                >
                    <SelectTrigger id="voter-municipality" aria-invalid={!!errors.municipality}>
                        <SelectValue placeholder="Selecciona tu municipio" />
                    </SelectTrigger>
                    <SelectContent>
                        {municipalities.map((muni) => (
                            <SelectItem key={muni.id} value={muni.id}>
                                {muni.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.municipality && (
                    <p className="text-sm text-destructive">{errors.municipality.message}</p>
                )}
            </div>

            {zones.length > 0 && (
                <div className="space-y-2">
                    <Label htmlFor="voter-zone">Zona / Comuna (Filtro Opcional)</Label>
                    <Select value={selectedZone} onValueChange={setSelectedZone}>
                        <SelectTrigger id="voter-zone">
                            <SelectValue placeholder="Todas las zonas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Todas las zonas</SelectItem>
                            {zones.map((zone) => (
                                <SelectItem key={zone} value={zone}>
                                    {zone}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="voter-polling-station">Puesto de Votación *</Label>
                <Popover open={openPollingStation} onOpenChange={setOpenPollingStation}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openPollingStation}
                            className="w-full justify-between"
                            disabled={!municipality}
                        >
                            {pollingStation
                                ? filteredStations.find((station) => station.id === pollingStation)?.name
                                : municipality ? "Buscar puesto..." : "Primero selecciona municipio"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Buscar puesto de votación..." />
                            <CommandList>
                                <CommandEmpty>No se encontró el puesto.</CommandEmpty>
                                <CommandGroup>
                                    {filteredStations.map((station) => (
                                        <CommandItem
                                            key={station.id}
                                            value={`${station.name} ${station.code || ''}`}
                                            onSelect={() => {
                                                setValue('pollingStation', station.id, { shouldValidate: true })
                                                setOpenPollingStation(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    pollingStation === station.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{station.name}</span>
                                                {station.code && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Código: {station.code}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {filteredStations.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                        {filteredStations.length} puesto{filteredStations.length !== 1 ? 's' : ''} disponible{filteredStations.length !== 1 ? 's' : ''}
                    </p>
                )}
                {errors.pollingStation && (
                    <p className="text-sm text-destructive">{errors.pollingStation.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="voter-table">Número de Mesa (Opcional)</Label>
                <Input
                    id="voter-table"
                    type="text"
                    placeholder="Ej: 25"
                    {...register('tableNumber')}
                    aria-invalid={!!errors.tableNumber}
                />
                {errors.tableNumber && (
                    <p className="text-sm text-destructive">{errors.tableNumber.message}</p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrar Votante'}
            </Button>
        </form>
    )
}
