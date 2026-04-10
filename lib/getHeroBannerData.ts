import { now } from '@/lib/time'

/**
 * Retorna textos e imagenes para el banner principal del residente.
 * Compatible con React Native (usa require en vez de rutas /img/…)
 */
export function getHeroBannerData(
  status: 'none' | 'upcoming' | 'tomorrow' | 'post',
  reservationDate?: string
) {
  const hour = now().hour()

  // Seleccion de fondo por hora del dia.
  let backgroundVideo: any = require('@/assets/backgrounds/morning.mp4')

  if (hour >= 5 && hour < 12) {
    backgroundVideo = require('@/assets/backgrounds/morning.mp4')
  } else if (hour >= 12 && hour < 20) {
    backgroundVideo = require('@/assets/backgrounds/afternoon.mp4')
  } else {
    backgroundVideo = require('@/assets/backgrounds/night.mp4')
  }

  // Personajes ilustrados.
  const characterImage1 = require('@/assets/characters/chica-pelo-rosado-bg.png')
  const characterImage2 = require('@/assets/characters/hombre-hoody-azul-bg.png')
  const characterImage3 = require('@/assets/characters/hombre-afroamericano-bg.png')
  const characterImage4 = require('@/assets/characters/chica-pelo-negro-bg.png')
  const characterImage5 = require('@/assets/characters/ejecutiva-con-piocha.png')

  // Definicion de mensajes segun estado.
  switch (status) {
    case 'none':
      return {
        title: '¿Listo para reservar?',
        subtitle: 'Elige un espacio y disfruta tu comunidad.',
        backgroundVideo,
        characterImage: characterImage4,
      }

    case 'upcoming':
      return {
        title: '¡Tienes una reserva próxima!',
        subtitle: `Reserva agendada para el ${reservationDate}`,
        backgroundVideo,
        characterImage: characterImage1,
      }

    case 'tomorrow':
      return {
        title: '¡Mañana tienes una reserva!',
        subtitle: `No olvides asistir el ${reservationDate}`,
        backgroundVideo,
        characterImage: characterImage2,
      }

    case 'post':
      return {
        title: 'Esperamos que hayas disfrutado tu reserva 😊',
        subtitle: '',
        backgroundVideo,
        characterImage: characterImage3,
      }

    default:
      return {
        title: 'Bienvenido',
        subtitle: '',
        backgroundVideo,
        characterImage: characterImage5,
      }
  }
}
