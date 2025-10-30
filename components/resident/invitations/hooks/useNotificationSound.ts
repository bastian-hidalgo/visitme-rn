import { useCallback, useEffect, useRef } from 'react'
import SoundPlayer from 'react-native-sound-player'

export function useNotificationSound() {
  const soundLoadedRef = useRef(false)

  const load = useCallback(async () => {
    if (soundLoadedRef.current) return
    try {
      // Si el archivo está en assets/sounds/notification.mp3
      SoundPlayer.loadSoundFile('notification', 'mp3')
      soundLoadedRef.current = true
    } catch (err) {
      console.warn('Error al cargar sonido de notificación', err)
    }
  }, [])

  const play = useCallback(async () => {
    try {
      if (!soundLoadedRef.current) await load()
      SoundPlayer.playSoundFile('notification', 'mp3')
    } catch (err) {
      console.warn('No se pudo reproducir el sonido de notificación', err)
    }
  }, [load])

  useEffect(() => {
    return () => {
      try {
        SoundPlayer.stop()
      } catch {
        /* noop */
      }
    }
  }, [])

  return { play }
}
