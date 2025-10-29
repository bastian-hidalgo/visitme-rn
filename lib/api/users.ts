import { supabase } from '@/lib/supabase'

const selectUserFields =
  'id, name, email, role, avatar_url, phone, accepts_notifications, birthday'

export type UpdateOwnProfileInput = {
  name?: string | null
  phone?: string | null
  birthday?: string | null
  acceptsNotifications?: boolean
  avatarUrl?: string | null
}

export async function updateOwnAvatar(userId: string, avatarUrl: string) {
  return updateOwnProfile(userId, { avatarUrl })
}

export async function updateOwnProfile(userId: string, input: UpdateOwnProfileInput) {
  const updatePayload: Record<string, any> = {}

  if (typeof input.name !== 'undefined') {
    updatePayload.name = input.name
  }
  if (typeof input.phone !== 'undefined') {
    updatePayload.phone = input.phone
  }
  if (typeof input.birthday !== 'undefined') {
    updatePayload.birthday = input.birthday
  }
  if (typeof input.acceptsNotifications !== 'undefined') {
    updatePayload.accepts_notifications = input.acceptsNotifications
  }
  if (typeof input.avatarUrl !== 'undefined') {
    updatePayload.avatar_url = input.avatarUrl
  }

  if (Object.keys(updatePayload).length === 0) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', userId)
    .select(selectUserFields)
    .single()

  if (error) {
    throw error
  }

  return data
}
