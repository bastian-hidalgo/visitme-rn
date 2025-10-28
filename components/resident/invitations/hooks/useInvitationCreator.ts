import { supabase } from '@/lib/supabase'
import { dayjs, now, toServerUTC } from '@/lib/time'

function generateSecretCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

async function generateInvitationCode(prefix: string) {
  let attempts = 0
  while (attempts < 10) {
    const code = `${prefix}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    const { data } = await supabase.from('visits').select('id').eq('code', code).limit(1)
    if (!data?.length) return code
    attempts++
  }
  throw new Error('No se pudo generar código único.')
}

export function useInvitationCreator({ communityId, userId, residentName }: any) {
  const create = async (form: any, department: any) => {
    const guests = Math.max(1, Number(form.guests))
    const expectedAt = form.expectedAt ? dayjs(form.expectedAt) : now()
    const expiresAt = dayjs(expectedAt).add(1, 'day')
    const prefix = form.type === 'vehicular' ? 'vsv' : 'vsp'
    const code = await generateInvitationCode(prefix)
    const secret = generateSecretCode()

    const payload = {
      community_id: communityId,
      department_id: department.id,
      department: department.label,
      user_id: userId,
      resident_name: residentName,
      visitor_name: form.visitorName.trim(),
      contact: form.contact || null,
      license_plate: form.type === 'vehicular' ? form.licensePlate.trim().toUpperCase() || null : null,
      type: form.type,
      guests,
      expected_at: expectedAt.toISOString(),
      scheduled_at: expectedAt.toISOString(),
      expires_at: toServerUTC(expiresAt),
    }

    const { data, error } = await supabase
      .from('visits')
      .insert({ ...payload, code, secret_code: secret })
      .select('code, secret_code')
      .maybeSingle()

    if (error) throw error
    return data
  }

  return { create }
}
