import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { hashPassword } from '@/lib/password'

// Hashing seguro basado en PBKDF2

// Validation schemas for each role
const candidateSchema = z.object({
  document: z.string().min(1, 'La cédula es requerida'),
  name: z.string().min(1, 'El nombre es requerido'),
  party: z.string().min(1, 'El partido es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const leaderSchema = z.object({
  document: z.string().min(1, 'La cédula es requerida'),
  name: z.string().min(1, 'El nombre es requerido'),
  candidateId: z.string().min(1, 'El candidato es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const voterSchema = z.object({
  document: z.string().min(1, 'La cédula es requerida'),
  name: z.string().min(1, 'El nombre es requerido'),
  tel: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email('Correo inválido').optional(),
  leaderId: z.string().optional(),
  municipality: z.string().optional(),
  pollingStation: z.string().optional(),
  tableNumber: z.string().optional(),
})

const registerSchema = z.object({
  role: z.enum(['candidate', 'leader', 'voter']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate role
    const { role } = registerSchema.parse(body)

    // Check if document already exists in any table
    const existingCandidate = await db.candidate.findUnique({
      where: { document: body.document }
    })

    if (existingCandidate) {
      return NextResponse.json({
        error: 'Documento ya registrado',
        message: `Documento ya vinculado a la campaña de ${existingCandidate.name}`,
        alreadyLinked: true,
        candidateName: existingCandidate.name
      }, { status: 400 })
    }

    const existingLeader = await db.leader.findUnique({
      where: { document: body.document },
      include: { candidate: true }
    })

    if (existingLeader) {
      return NextResponse.json({
        error: 'Documento ya registrado',
        message: `Documento ya vinculado a la campaña de ${existingLeader.candidate.name}`,
        alreadyLinked: true,
        candidateName: existingLeader.candidate.name
      }, { status: 400 })
    }

    const existingVoter = await db.voter.findUnique({
      where: { document: body.document },
      include: { leader: { include: { candidate: true } } }
    })

    if (existingVoter) {
      const candidateName = existingVoter.leader?.candidate?.name || 'No disponible'
      return NextResponse.json({
        error: 'Documento ya registrado',
        message: `Documento ya vinculado a la campaña de ${candidateName}`,
        alreadyLinked: true,
        candidateName
      }, { status: 400 })
    }

    // Register based on role
    let result: any

    switch (role) {
      case 'candidate':
        const candidateData = candidateSchema.parse(body)
        result = await db.candidate.create({
          data: {
            ...candidateData,
            password: hashPassword(candidateData.password)
          }
        })
        break

      case 'leader':
        const leaderData = leaderSchema.parse(body)

        // Verify candidate exists
        const candidate = await db.candidate.findUnique({
          where: { id: leaderData.candidateId }
        })

        if (!candidate) {
          return NextResponse.json({
            error: 'Candidato no encontrado',
            message: 'El candidato seleccionado no existe'
          }, { status: 404 })
        }

        result = await db.leader.create({
          data: {
            ...leaderData,
            password: hashPassword(leaderData.password)
          },
          include: { candidate: true }
        })
        break

      case 'voter':
        const voterData = voterSchema.parse(body)

        // Find or create municipality and polling station
        let municipality: { id: string } | null = null
        let pollingStation: { id: string } | null = null

        if (voterData.municipality) {
          municipality = await db.municipality.findFirst({
            where: { name: voterData.municipality }
          })

          if (!municipality) {
            // Create municipality if not exists (for demo purposes)
            const department = await db.department.findFirst()
            if (department) {
              municipality = await db.municipality.create({
                data: {
                  name: voterData.municipality,
                  code: `MUN-${Date.now()}`,
                  departmentId: department.id
                }
              })
            }
          }

          if (voterData.pollingStation && municipality) {
            const foundPolling = await db.pollingStation.findFirst({
              where: {
                name: voterData.pollingStation,
                municipalityId: municipality.id
              }
            })

            if (!foundPolling) {
              const createdPolling = await db.pollingStation.create({
                data: {
                  name: voterData.pollingStation,
                  code: `PST-${Date.now()}`,
                  municipalityId: municipality.id
                }
              })
              pollingStation = { id: createdPolling.id }
            } else {
              pollingStation = { id: foundPolling.id }
            }
          }
        }

        // Validate leader if provided
        if (voterData.leaderId) {
          const leader = await db.leader.findUnique({
            where: { id: voterData.leaderId }
          })

          if (!leader) {
            return NextResponse.json({
              error: 'Líder no encontrado',
              message: 'El líder seleccionado no existe'
            }, { status: 404 })
          }
        }

        result = await db.voter.create({
          data: {
            document: voterData.document,
            name: voterData.name,
            tel: voterData.tel || null,
            celular: voterData.celular || null,
            email: voterData.email || null,
            leaderId: voterData.leaderId || null,
            municipalityId: municipality?.id || null,
            pollingStationId: pollingStation?.id || null,
            tableNumber: voterData.tableNumber || null
          } as any,
          include: {
            leader: {
              include: { candidate: true }
            },
            pollingStation: true,
            municipality: true
          }
        })
        break

      default:
        return NextResponse.json({
          error: 'Rol inválido',
          message: 'El rol especificado no es válido'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `${role === 'candidate' ? 'Candidato' : role === 'leader' ? 'Líder' : 'Votante'} registrado exitosamente`,
      data: result
    })

  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Error de validación',
        message: error.issues[0]?.message || 'Datos inválidos',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Error del servidor',
      message: 'Ocurrió un error al procesar la solicitud'
    }, { status: 500 })
  }
}
