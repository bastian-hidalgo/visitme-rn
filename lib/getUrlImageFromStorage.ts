import Constants from 'expo-constants'

const getUrlImageFromStorage = (imageName: string, storage: string) => {
  const supabaseUrl =
    Constants.expoConfig?.extra?.SUPABASE_URL ||
    Constants.manifest2?.extra?.SUPABASE_URL ||
    'https://tu-proyecto.supabase.co'

  return `${supabaseUrl}/storage/v1/object/public/${storage}/${imageName}`
}

export default getUrlImageFromStorage
