import { useCallback, useEffect, useRef } from 'react'

export function useNotificationSound() {
  const soundRef = useRef<any>(null)

  const load = useCallback(async () => {
    try {
      const { Audio } = await import('expo-av')
      const result = await Audio.Sound.createAsync(
        require('../../../../assets/sounds/notification.mp3'),
        { shouldPlay: false }
      )
      soundRef.current = result.sound
    } catch (err) {
      console.warn('Error al cargar sonido de notificación', err)
    }
  }, [])

  const play = useCallback(async () => {
    if (!soundRef.current) await load()
    try {
      await soundRef.current?.replayAsync?.()
    } catch {
      console.warn('No se pudo reproducir el sonido')
    }
  }, [load])

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync?.()
    }
  }, [])

  return { play }
}
