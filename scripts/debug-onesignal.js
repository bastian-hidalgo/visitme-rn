// Usage: node scripts/debug-onesignal.js
// Requires running inside a native environment (Dev Client or production build)
const OneSignal = require('react-native-onesignal').default

const APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || ''

const log = (...args) => console.log('[OneSignal:DEBUG]', ...args)
const logErr = (...args) => console.error('[OneSignal:DEBUG:ERR]', ...args)

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  if (!APP_ID) {
    logErr('Falta EXPO_PUBLIC_ONESIGNAL_APP_ID en variables de entorno')
    process.exit(1)
  }

  const moduleKeys = Object.keys(OneSignal || {})
  const hasInitialize = typeof OneSignal?.initialize === 'function'
  const hasSetAppId = typeof OneSignal?.setAppId === 'function'

  log('Resolviendo módulo nativo', { moduleKeys, hasInitialize, hasSetAppId })

  if (!OneSignal || (!hasInitialize && !hasSetAppId)) {
    logErr(
      'Módulo nativo OneSignal no disponible. Asegura haber corrido `expo prebuild` con el plugin de OneSignal y usar un Dev Client o build nativa.',
    )
    process.exit(1)
  }

  const initializerName = hasInitialize ? 'initialize' : 'setAppId'
  log('Inicializando SDK con APP_ID', APP_ID, 'usando', initializerName)
  try {
    if (hasInitialize) {
      OneSignal.initialize(APP_ID)
    } else {
      OneSignal.setAppId(APP_ID)
    }
  } catch (error) {
    logErr('No se pudo inicializar OneSignal', error)
    process.exit(1)
  }

  let playerId = null
  let pushToken = null
  let isSubscribed = null
  let isPushDisabled = null

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      const subscription = OneSignal.User?.pushSubscription
      playerId = (await subscription?.getId?.()) ?? subscription?.id ?? null
      const status = await OneSignal.User?.pushSubscription?.getOptedIn?.()
      const state = await OneSignal.User?.getState?.()
      pushToken = state?.pushToken ?? null
      isSubscribed = status ?? state?.isSubscribed ?? null
      isPushDisabled = state?.isPushDisabled ?? null
    } catch (error) {
      logErr('Error obteniendo estado', error)
    }

    if (playerId) break
    await wait(500)
  }

  log('SDK Loaded:', true)
  log('Device State:', {
    player_id: playerId,
    pushToken,
    isSubscribed,
    isPushDisabled,
  })

  process.exit(0)
}

main()
