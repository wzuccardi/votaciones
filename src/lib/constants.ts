// Constantes de la aplicación

// Código DANE del departamento de Bolívar
// La aplicación está diseñada exclusivamente para el departamento de Bolívar, Colombia
export const BOLIVAR_CODE = '13'
export const BOLIVAR_NAME = 'Bolívar'

// Configuración de paginación
export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 100

// Configuración de caché (en milisegundos)
export const CACHE_TIME = {
  MUNICIPALITIES: 60 * 60 * 1000, // 1 hora (datos estáticos)
  POLLING_STATIONS: 30 * 60 * 1000, // 30 minutos
  VOTERS: 1 * 60 * 1000, // 1 minuto
  STATISTICS: 30 * 1000, // 30 segundos
}
