import Constants from 'expo-constants'

const PUBLIC_STORAGE_PREFIX = '/storage/v1/object/public/'

const getUrlImageFromStorage = (imageName: string, storage: string) => {
  if (!imageName) return ''

  if (/^https?:\/\//.test(imageName)) {
    return imageName
  }

  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    Constants.expoConfig?.extra?.SUPABASE_URL ||
    Constants.manifest2?.extra?.SUPABASE_URL ||
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
