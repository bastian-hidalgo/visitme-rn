import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { OneSignal } from 'react-native-onesignal'

type PushSubscriptionChangeEvent = {
  pushSubscription?: {
    id?: string | null
  }
}

type PushSubscriptionModule = {
  id?: string | null
  getId?: () => Promise<string | null> | string | null
  addEventListener?: (
    event: 'change',
    listener: (event: PushSubscriptionChangeEvent) => void,
  ) => void
  removeEventListener?: (
    event: 'change',
    listener: (event: PushSubscriptionChangeEvent) => void,
  ) => void
}

const LOG_PREFIX = '[OneSignal]'
const ERR_PREFIX = '[OneSignal:ERR]'
const MAX_RETRIES = 3
const PLAYER_POLL_RETRIES = 5
const PLAYER_POLL_DELAY = 350

const log = (message: string, ...args: unknown[]) => {
  console.log(`${LOG_PREFIX} ${message}`, ...args)
}

const logError = (message: string, ...args: unknown[]) => {
  console.error(`${ERR_PREFIX} ${message}`, ...args)
}

const getPushSubscription = (): PushSubscriptionModule | undefined => {
  return OneSignal?.User?.pushSubscription as PushSubscriptionModule | undefined
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const syncPlayerIdToSupabase = async (
  playerId: string | null | undefined,
  userId: string,
  communityId: string,
) => {
  if (!playerId) {
    logError('syncPlayerIdToSupabase omitido: playerId vacío')
    return
  }

  const normalizedPlayerId = playerId.trim()
  if (!normalizedPlayerId) {
    logError('syncPlayerIdToSupabase omitido: playerId sin contenido')
    return
  }

  log('Sincronizando player_id → Supabase', { normalizedPlayerId, userId, communityId })

  const { error } = await supabase.from('onesignal_players').upsert(
    {
      user_id: userId,
      community_id: communityId,
      player_id: normalizedPlayerId,
    },
    {
      onConflict: 'user_id,community_id,player_id',
      ignoreDuplicates: true,
    },
  )

  if (error) {
    throw error
  }

  log('player_id sincronizado en Supabase', {
    userId,
    communityId,
    playerId: normalizedPlayerId,
  })
}

const syncPlayerIdWithRetry = async (
  playerId: string | null | undefined,
  userId: string,
  communityId: string,
) => {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await syncPlayerIdToSupabase(playerId, userId, communityId)
      return
    } catch (err) {
      lastError = err
      logError(`Error sincronizando player_id (intento ${attempt}/${MAX_RETRIES})`, err)
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 300 * attempt))
      }
    }
  }

  if (lastError) {
    throw lastError
  }
}

export const registerPushSubscriptionListener = (
  userId: string,
  communityId: string,
) => {
  const pushSubscription = getPushSubscription()

  if (!pushSubscription?.addEventListener) {
    log('pushSubscription listener omitido: módulo no disponible')
    return () => {}
  }

  const handler = (event: PushSubscriptionChangeEvent) => {
    const newPlayerId = event?.pushSubscription?.id ?? pushSubscription.id
    if (!newPlayerId) {
      log('pushSubscription change recibido sin player_id, se omitió sync')
      return
    }

    log('pushSubscription change → player_id detectado, sincronizando', newPlayerId)
    void syncPlayerIdWithRetry(newPlayerId, userId, communityId)
  }

  pushSubscription.addEventListener('change', handler)
  log('Listener de pushSubscription registrado')

  return () => {
    pushSubscription.removeEventListener?.('change', handler)
    log('Listener de pushSubscription removido')
  }
}

export const getCurrentPlayerId = async (): Promise<string | null> => {
  try {
    const pushSubscription = getPushSubscription()
    if (!pushSubscription) {
      log('pushSubscription aún no disponible para obtener player_id')
      return null
    }

    const currentId = await pushSubscription.getId?.()
    const resolved = currentId ?? pushSubscription.id ?? null
    if (!resolved) {
      log('pushSubscription disponible pero sin player_id actual')
    }

    return resolved
  } catch (err) {
    logError('No se pudo obtener el player_id actual', err)
    return null
  }
}

const getCurrentPlayerIdWithRetry = async (): Promise<string | null> => {
  let lastId: string | null = null

  for (let attempt = 1; attempt <= PLAYER_POLL_RETRIES; attempt += 1) {
    lastId = await getCurrentPlayerId()

    if (lastId) {
      if (attempt > 1) {
        log('player_id obtenido tras reintento', { attempt, lastId })
      }
      break
    }

    log('player_id no disponible, reintentando', { attempt, max: PLAYER_POLL_RETRIES })
    await sleep(PLAYER_POLL_DELAY * attempt)
  }

  return lastId
}

export const ensureCurrentPlayerSynced = async (
  userId: string,
  communityId: string,
) => {
  log('Iniciando sync de player_id actual', { userId, communityId })
  const currentId = await getCurrentPlayerIdWithRetry()
  if (!currentId) {
    log('No se encontró player_id actual para sincronizar')
    return
  }

  await syncPlayerIdWithRetry(currentId, userId, communityId)
}

export const useOneSignalPlayer = () => {
  const [playerId, setPlayerId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const pushSubscription = getPushSubscription()

    const loadCurrent = async () => {
      const current = await getCurrentPlayerId()
      if (active) {
        setPlayerId(current)
      }
    }

    const handler = (event: PushSubscriptionChangeEvent) => {
      const nextId = event?.pushSubscription?.id ?? pushSubscription?.id ?? null
      setPlayerId(nextId)
    }

    void loadCurrent()

    pushSubscription?.addEventListener?.('change', handler)

    return () => {
      active = false
      pushSubscription?.removeEventListener?.('change', handler)
    }
  }, [])

  return playerId
}

export const exampleUsage = `
import { ensureCurrentPlayerSynced, registerPushSubscriptionListener } from '@/lib/notifications/oneSignalSync'

// Dentro de tu provider o efecto:
const cleanup = registerPushSubscriptionListener(userId, communityId)
await ensureCurrentPlayerSynced(userId, communityId)

// En cleanup de efecto
cleanup()
`
