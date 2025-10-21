// import * as Analytics from 'expo-firebase-analytics'

// export const GA_MEASUREMENT_ID =
//   process.env.EXPO_PUBLIC_GOOGLE_ANALYTICS_ID || ''

// // 🔹 Envío de pageview (equivalente)
// export const pageview = async (screen_name: string) => {
//   try {
//     await Analytics.logEvent('screen_view', {
//       screen_name,
//       screen_class: screen_name,
//     })
//   } catch (e) {
//     console.warn('[Analytics] Error enviando pageview:', e)
//   }
// }

// // 🔹 Registro de eventos
// export const logEvent = async (
//   eventName: string,
//   params?: Record<string, any>
// ) => {
//   try {
//     await Analytics.logEvent(eventName, params || {})
//   } catch (e) {
//     console.warn('[Analytics] Error enviando evento:', e)
//   }
// }

// // 🔹 Set de userId
// export const setUserId = async (userId: string) => {
//   try {
//     await Analytics.setUserId(userId)
//   } catch (e) {
//     console.warn('[Analytics] Error seteando userId:', e)
//   }
// }

// // 🔹 Propiedades del usuario
// export const setUserProperties = async (props: Record<string, any>) => {
//   try {
//     for (const [key, value] of Object.entries(props)) {
//       await Analytics.setUserProperty(key, String(value))
//     }
//   } catch (e) {
//     console.warn('[Analytics] Error seteando userProperties:', e)
//   }
// }
