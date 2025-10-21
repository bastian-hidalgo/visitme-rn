import { now } from '@/lib/time'

/**
 * Retorna textos e imágenes para el banner principal del residente.
 * Compatible con React Native (usa require en vez de rutas /img/…)
 */
export function getHeroBannerData(
  status: 'none' | 'upcoming' | 'tomorrow' | 'post',
  reservationDate?: string
) {
  const hour = now().hour()

  // 🔹 Selección de fondo por hora del día
  let backgroundImage: any = require('@/assets/backgrounds/morning.webp')

  if (hour >= 5 && hour < 12) {
    backgroundImage = require('@/assets/backgrounds/morning.webp')
  } else if (hour >= 12 && hour < 20) {
    backgroundImage = require('@/assets/backgrounds/afternoon.webp')
  } else {
    backgroundImage = require('@/assets/backgrounds/night.webp')
  }

  // 🔹 Personajes ilustrados
  const characterImage1 = require('@/assets/characters/girl-hero-1.webp')
  const characterImage2 = require('@/assets/characters/girl-hero-2.webp')
  const characterImage3 = require('@/assets/characters/man-hero-1.webp')
  const characterImage4 = require('@/assets/characters/man-hero-2.webp')
  const characterImage5 = require('@/assets/characters/man-hero-3.webp')

  // 🔹 Definición de mensajes según estado
  switch (status) {
    case 'none':
      return {
        title: '¿Listo para reservar?',
        subtitle: 'Elige un espacio y disfruta tu comunidad.',
        backgroundImage,
        characterImage: characterImage4,
      }

    case 'upcoming':
      return {
        title: '¡Tienes una reserva próxima!',
        subtitle: `Reserva agendada para el ${reservationDate}`,
        backgroundImage,
        characterImage: characterImage1,
      }

    case 'tomorrow':
      return {
        title: '¡Mañana tienes una reserva!',
        subtitle: `No olvides asistir el ${reservationDate}`,
        backgroundImage,
        characterImage: characterImage2,
      }

    case 'post':
      return {
        title: 'Esperamos que hayas disfrutado tu reserva 😊',
        subtitle: '',
        backgroundImage,
        characterImage: characterImage3,
      }

    default:
      return {
        title: 'Bienvenido',
        subtitle: '',
        backgroundImage,
        characterImage: characterImage5,
      }
  }
}
