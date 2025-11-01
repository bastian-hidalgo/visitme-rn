import Constants from 'expo-constants'

import { env } from '@/constants/env'

const PUBLIC_STORAGE_PREFIX = '/storage/v1/object/public/'

const getUrlImageFromStorage = (imageName: string, storage: string) => {
  if (!imageName) return ''

  if (/^https?:\/\//.test(imageName)) {
    return imageName
  }

  const manifestExtra =
    (Constants.manifest2?.extra as Record<string, string | undefined> | undefined) ||
    (Constants.manifest?.extra as Record<string, string | undefined> | undefined)

  const supabaseUrl =
    env.supabaseUrl ||
    process.env.SUPABASE_URL ||
    (Constants.expoConfig?.extra as Record<string, string | undefined>)?.SUPABASE_URL ||
    manifestExtra?.SUPABASE_URL ||
    'https://tu-proyecto.supabase.co'

  let normalized = imageName.replace(/^\/+/, '')

  const prefixWithoutSlash = PUBLIC_STORAGE_PREFIX.replace(/^\//, '')

  if (normalized.startsWith(prefixWithoutSlash)) {
    const path = normalized.startsWith('/') ? normalized : `/${normalized}`
    return `${supabaseUrl}${path.startsWith('/') ? path : `/${path}`}`
  }

  if (normalized.startsWith(PUBLIC_STORAGE_PREFIX)) {
    const path = normalized.startsWith('/') ? normalized : `/${normalized}`
    return `${supabaseUrl}${path}`
  }

  if (normalized.startsWith('public/')) {
    normalized = normalized.replace(/^public\//, '')
  }

  if (normalized.startsWith(storage + '/')) {
    return `${supabaseUrl}${PUBLIC_STORAGE_PREFIX}${normalized}`
  }

  return `${supabaseUrl}${PUBLIC_STORAGE_PREFIX}${storage}/${normalized}`
}

export default getUrlImageFromStorage
