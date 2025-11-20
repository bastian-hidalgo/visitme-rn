import type { Database } from '@/types/supabase'

export type CommunityDocument = Database['public']['Tables']['community_documents']['Row']
export type CommunityDocumentInsert = Database['public']['Tables']['community_documents']['Insert']
export type CommunityDocumentUpdate = Database['public']['Tables']['community_documents']['Update']

export type CommunityDocumentCategory =
  | 'plan'
  | 'permiso'
  | 'plano'
  | 'reglamento'
  | 'acta'
  | 'otro'

export const COMMUNITY_DOCUMENT_CATEGORY_OPTIONS: {
  value: CommunityDocumentCategory
  label: string
  description: string
}[] = [
  { value: 'plan', label: 'Plan de emergencia', description: 'Protocolos y planes de acción comunitarios.' },
  { value: 'permiso', label: 'Permisos', description: 'Autorizaciones generales de la comunidad.' },
  { value: 'plano', label: 'Planos', description: 'Planos de infraestructura y áreas comunes.' },
  { value: 'reglamento', label: 'Reglamentos', description: 'Normativas internas y reglamentos oficiales.' },
  { value: 'acta', label: 'Actas', description: 'Actas de asambleas o reuniones relevantes.' },
  { value: 'otro', label: 'Otros', description: 'Documentación complementaria y miscelánea.' },
]

const CATEGORY_LABEL_MAP = COMMUNITY_DOCUMENT_CATEGORY_OPTIONS.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.label
  return acc
}, {})

export const getCommunityDocumentCategoryLabel = (category?: string | null): string => {
  if (!category) return 'Sin categoría'
  return CATEGORY_LABEL_MAP[category] ?? category
}

export const formatDocumentSize = (bytes?: number | null): string => {
  if (!bytes || Number.isNaN(bytes)) {
    return '—'
  }

  const units = ['B', 'KB', 'MB', 'GB'] as const
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export const sortCommunityDocuments = (documents: CommunityDocument[]): CommunityDocument[] => {
  const getReferenceDate = (doc: CommunityDocument) =>
    doc.published_at || doc.created_at || doc.updated_at || ''

  return [...documents].sort((a, b) => {
    const dateA = Date.parse(getReferenceDate(a))
    const dateB = Date.parse(getReferenceDate(b))
    return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA)
  })
}
