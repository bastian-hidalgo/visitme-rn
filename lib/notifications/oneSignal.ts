import OneSignal from '@onesignal/react-native'

let initialized = false
let hasWarnedAppId = false

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID

const ensureInitialized = () => {
  if (initialized) return true

  if (!ONESIGNAL_APP_ID) {
    if (!hasWarnedAppId) {
      console.warn('[OneSignal] EXPO_PUBLIC_ONESIGNAL_APP_ID is not defined')
      hasWarnedAppId = true
    }
    return false
  }

  try {
    OneSignal.initialize(ONESIGNAL_APP_ID)
    initialized = true
    return true
  } catch (error) {
    console.error('[OneSignal] Failed to initialize SDK', error)
    return false
  }
}

export const initializeOneSignal = () => ensureInitialized()

export const loginOneSignalUser = (userId: string | null) => {
  if (!ensureInitialized()) return

  try {
    if (userId) {
      OneSignal.login(userId)
    } else {
      OneSignal.logout()
    }
  } catch (error) {
    console.error('[OneSignal] Failed to (un)register user', error)
  }
}

export const updatePushSubscription = (enabled: boolean) => {
  if (!ensureInitialized()) return

  try {
    const pushSubscription = OneSignal.User?.pushSubscription

    if (pushSubscription?.optIn && pushSubscription.optOut) {
      if (enabled) {
        pushSubscription.optIn()
      } else {
        pushSubscription.optOut()
      }
      return
    }

    OneSignal.Notifications.disablePush(!enabled)
  } catch (error) {
    console.error('[OneSignal] Failed to update push subscription', error)
  }
}

export const promptForPushPermission = async () => {
  if (!ensureInitialized()) return false

  try {
    const granted = await OneSignal.Notifications.requestPermission(true)
    return Boolean(granted)
  } catch (error) {
    console.error('[OneSignal] Failed to request notification permission', error)
    return false
  }
}

export const logoutOneSignalUser = () => {
  loginOneSignalUser(null)
}
