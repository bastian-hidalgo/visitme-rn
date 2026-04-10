import { getBaseUrl } from '@/lib/getBaseUrl'
import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface PetData {
  department_id: string
  name: string
  type?: string | null
  breed?: string | null
  observations?: string | null
  photo_url?: string | null
}

export interface VehicleData {
  department_id: string
  license_plate: string
  brand?: string | null
  model?: string | null
  color?: string | null
}

export interface HouseholdData {
  department_id: string
  name: string
  relationship?: string | null
  age?: number | null
}

type CommunityContext = {
  communityId?: string
  communitySlug?: string
}

type JsonRecord = Record<string, unknown>

const COMMUNITY_SLUG_KEY = 'selected_community'
const COMMUNITY_ID_KEY = 'selected_community_id'

const getCommunityContext = async (): Promise<CommunityContext> => {
  const [[, communitySlug], [, communityId]] = await AsyncStorage.multiGet([
    COMMUNITY_SLUG_KEY,
    COMMUNITY_ID_KEY,
  ])

  return {
    communityId: communityId || undefined,
    communitySlug: communitySlug || undefined,
  }
}

const buildCommunityCookieHeader = (context: CommunityContext): string | undefined => {
  const cookies: string[] = []

  if (context.communitySlug) {
    cookies.push(`selected_community=${encodeURIComponent(context.communitySlug)}`)
  }

  if (context.communityId) {
    cookies.push(`selected_community_id=${encodeURIComponent(context.communityId)}`)
  }

  return cookies.length > 0 ? cookies.join('; ') : undefined
}

const parseJsonBody = (body: BodyInit | null | undefined): JsonRecord | null => {
  if (typeof body !== 'string') {
    return null
  }

  try {
    return JSON.parse(body) as JsonRecord
  } catch {
    return null
  }
}

const resolveCommunityFromDepartment = async (departmentId?: string): Promise<CommunityContext> => {
  if (!departmentId) {
    return {}
  }

  const { data, error } = await supabase
    .from('departments')
    .select('community_id, communities:community_id(slug)')
    .eq('id', departmentId)
    .maybeSingle()

  if (error || !data?.community_id) {
    return {}
  }

  const community = Array.isArray(data.communities) ? data.communities[0] : data.communities

  return {
    communityId: data.community_id,
    communitySlug: typeof community?.slug === 'string' ? community.slug : undefined,
  }
}

const resolveRequestContext = async (body: BodyInit | null | undefined): Promise<CommunityContext> => {
  const storageContext = await getCommunityContext()
  const payload = parseJsonBody(body)
  const departmentId = typeof payload?.department_id === 'string'
    ? payload.department_id
    : typeof payload?.departmentId === 'string'
      ? payload.departmentId
      : undefined

  const departmentContext = await resolveCommunityFromDepartment(departmentId)

  return {
    communityId: departmentContext.communityId ?? storageContext.communityId,
    communitySlug: departmentContext.communitySlug ?? storageContext.communitySlug,
  }
}

const withCommunityQuery = (path: string, context: CommunityContext) => {
  if (!context.communitySlug && !context.communityId) {
    return path
  }

  const [pathname, search = ''] = path.split('?')
  const params = new URLSearchParams(search)

  if (context.communitySlug && !params.has('community')) {
    params.set('community', context.communitySlug)
  }

  if (context.communityId && !params.has('communityId')) {
    params.set('communityId', context.communityId)
  }

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

const enrichPayload = (body: BodyInit | null | undefined, context: CommunityContext): BodyInit | null | undefined => {
  const payload = parseJsonBody(body)

  if (!payload) {
    return body
  }

  const enrichedPayload: JsonRecord = { ...payload }

  if (typeof payload.department_id === 'string' && !('departmentId' in enrichedPayload)) {
    enrichedPayload.departmentId = payload.department_id
  }

  if (context.communityId) {
    enrichedPayload.community_id = context.communityId
    enrichedPayload.communityId = context.communityId
  }

  if (context.communitySlug) {
    enrichedPayload.community_slug = context.communitySlug
    enrichedPayload.communitySlug = context.communitySlug
  }

  return JSON.stringify(enrichedPayload)
}

const getAuthHeaders = async (communityContext: CommunityContext) => {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  const communityCookie = buildCommunityCookieHeader(communityContext)

  if (!accessToken) {
    throw new Error('No hay sesión activa.')
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(communityContext.communitySlug ? { 'X-Community-Slug': communityContext.communitySlug } : {}),
    ...(communityContext.communityId ? { 'X-Community-Id': communityContext.communityId } : {}),
    ...(communityCookie ? { Cookie: communityCookie } : {}),
  }
}

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const payload = await response.json()
      if (typeof payload?.error === 'string' && payload.error) return payload.error
      if (typeof payload?.message === 'string' && payload.message) return payload.message
    }

    const text = await response.text()
    if (text.trim()) return text
  } catch {
    // Ignore parse errors and use fallback.
  }

  return fallback
}

async function requestConcierge(path: string, init: RequestInit, fallbackMessage: string): Promise<Response> {
  const communityContext = await resolveRequestContext(init.body)
  const headers = await getAuthHeaders(communityContext)
  const response = await fetch(`${getBaseUrl()}${withCommunityQuery(path, communityContext)}`, {
    ...init,
    body: enrichPayload(init.body, communityContext),
    credentials: 'include',
    headers: {
      ...headers,
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallbackMessage))
  }

  return response
}

export async function savePet(data: PetData, id?: string): Promise<Response> {
  const url = id ? `/api/concierge/pets?id=${id}` : '/api/concierge/pets'
  const method = id ? 'PUT' : 'POST'

  return requestConcierge(
    url,
    {
      method,
      body: JSON.stringify(data),
    },
    'Error al guardar la mascota',
  )
}

export async function deletePet(id: string): Promise<Response> {
  return requestConcierge(
    `/api/concierge/pets?id=${id}`,
    { method: 'DELETE' },
    'Error al eliminar la mascota',
  )
}

export async function saveVehicle(data: VehicleData, id?: string): Promise<Response> {
  const url = id ? `/api/concierge/vehicles?id=${id}` : '/api/concierge/vehicles'
  const method = id ? 'PUT' : 'POST'

  return requestConcierge(
    url,
    {
      method,
      body: JSON.stringify(data),
    },
    'Error al guardar el vehículo',
  )
}

export async function deleteVehicle(id: string): Promise<Response> {
  return requestConcierge(
    `/api/concierge/vehicles?id=${id}`,
    { method: 'DELETE' },
    'Error al eliminar el vehículo',
  )
}

export async function saveHousehold(data: HouseholdData, id?: string): Promise<Response> {
  const url = id ? `/api/concierge/household?id=${id}` : '/api/concierge/household'
  const method = id ? 'PUT' : 'POST'

  return requestConcierge(
    url,
    {
      method,
      body: JSON.stringify(data),
    },
    'Error al guardar la carga familiar',
  )
}

export async function deleteHousehold(id: string): Promise<Response> {
  return requestConcierge(
    `/api/concierge/household?id=${id}`,
    { method: 'DELETE' },
    'Error al eliminar la carga familiar',
  )
}