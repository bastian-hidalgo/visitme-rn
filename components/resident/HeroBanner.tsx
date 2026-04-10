import { getHeroBannerData } from '@/lib/getHeroBannerData'
import type { EventSubscription } from 'expo-modules-core'
import { useVideoPlayer, VideoView } from 'expo-video'
import { MotiText, MotiView } from 'moti'
import React, { useEffect, useRef, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'

interface HeroBannerProps {
  reservationStatus: 'none' | 'upcoming' | 'tomorrow' | 'post'
  reservationDate?: string
}

const BANNER_HEIGHT = 120
const CROSSFADE_DURATION_MS = 420
const CROSSFADE_LEAD_SECONDS = 0.45

export default function HeroBanner({ reservationStatus, reservationDate }: HeroBannerProps) {
  const { title, subtitle, backgroundVideo, characterImage } =
    getHeroBannerData(reservationStatus, reservationDate)

  const [activeLayer, setActiveLayer] = useState<0 | 1>(0)
  const activeLayerRef = useRef<0 | 1>(0)
  const isTransitioningRef = useRef(false)
  const crossfadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const primaryPlayer = useVideoPlayer(backgroundVideo, (videoPlayer) => {
    videoPlayer.loop = false
    videoPlayer.muted = true
    videoPlayer.timeUpdateEventInterval = 0.1
    videoPlayer.play()
  })

  const secondaryPlayer = useVideoPlayer(backgroundVideo, (videoPlayer) => {
    videoPlayer.loop = false
    videoPlayer.muted = true
    videoPlayer.timeUpdateEventInterval = 0.1
    videoPlayer.pause()
    videoPlayer.currentTime = 0
  })

  useEffect(() => {
    activeLayerRef.current = activeLayer
  }, [activeLayer])

  useEffect(() => {
    if (crossfadeTimeoutRef.current) {
      clearTimeout(crossfadeTimeoutRef.current)
      crossfadeTimeoutRef.current = null
    }

    activeLayerRef.current = 0
    isTransitioningRef.current = false
    setActiveLayer(0)

    primaryPlayer.pause()
    primaryPlayer.currentTime = 0
    primaryPlayer.play()

    secondaryPlayer.pause()
    secondaryPlayer.currentTime = 0
  }, [backgroundVideo, primaryPlayer, secondaryPlayer])

  useEffect(() => {
    const getPlayers = () => {
      return activeLayerRef.current === 0
        ? { activePlayer: primaryPlayer, inactivePlayer: secondaryPlayer, nextLayer: 1 as const }
        : { activePlayer: secondaryPlayer, inactivePlayer: primaryPlayer, nextLayer: 0 as const }
    }

    const finishCrossfade = (previousPlayer: typeof primaryPlayer) => {
      previousPlayer.pause()
      previousPlayer.currentTime = 0
      isTransitioningRef.current = false
      crossfadeTimeoutRef.current = null
    }

    const startCrossfade = () => {
      if (isTransitioningRef.current) {
        return
      }

      const { activePlayer, inactivePlayer, nextLayer } = getPlayers()
      isTransitioningRef.current = true

      inactivePlayer.pause()
      inactivePlayer.currentTime = 0
      inactivePlayer.play()
      setActiveLayer(nextLayer)

      if (crossfadeTimeoutRef.current) {
        clearTimeout(crossfadeTimeoutRef.current)
      }

      crossfadeTimeoutRef.current = setTimeout(() => {
        finishCrossfade(activePlayer)
      }, CROSSFADE_DURATION_MS)
    }

    const handleTimeUpdate = (layer: 0 | 1, currentTime: number) => {
      if (activeLayerRef.current !== layer || isTransitioningRef.current) {
        return
      }

      const activePlayer = layer === 0 ? primaryPlayer : secondaryPlayer
      const remainingTime = activePlayer.duration - currentTime

      if (Number.isFinite(remainingTime) && remainingTime <= CROSSFADE_LEAD_SECONDS) {
        startCrossfade()
      }
    }

    const subscriptions: EventSubscription[] = [
      primaryPlayer.addListener('timeUpdate', ({ currentTime }) => handleTimeUpdate(0, currentTime)),
      secondaryPlayer.addListener('timeUpdate', ({ currentTime }) => handleTimeUpdate(1, currentTime)),
      primaryPlayer.addListener('playToEnd', () => {
        if (activeLayerRef.current === 0) {
          startCrossfade()
        }
      }),
      secondaryPlayer.addListener('playToEnd', () => {
        if (activeLayerRef.current === 1) {
          startCrossfade()
        }
      }),
    ]

    return () => {
      if (crossfadeTimeoutRef.current) {
        clearTimeout(crossfadeTimeoutRef.current)
        crossfadeTimeoutRef.current = null
      }
      subscriptions.forEach((subscription) => subscription.remove())
    }
  }, [primaryPlayer, secondaryPlayer])

  const sharedVideoProps = {
    contentFit: 'cover' as const,
    nativeControls: false,
    fullscreenOptions: { enable: false },
    allowsPictureInPicture: false,
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.background}>
          <MotiView
            pointerEvents="none"
            style={styles.backgroundLayer}
            animate={{ opacity: activeLayer === 0 ? 1 : 0 }}
            transition={{ type: 'timing', duration: CROSSFADE_DURATION_MS }}
          >
            <VideoView
              player={primaryPlayer}
              style={styles.backgroundVideo}
              {...sharedVideoProps}
            />
          </MotiView>

          <MotiView
            pointerEvents="none"
            style={styles.backgroundLayer}
            animate={{ opacity: activeLayer === 1 ? 1 : 0 }}
            transition={{ type: 'timing', duration: CROSSFADE_DURATION_MS }}
          >
            <VideoView
              player={secondaryPlayer}
              style={styles.backgroundVideo}
              {...sharedVideoProps}
            />
          </MotiView>

          <View style={styles.overlay} />

          <View style={styles.content}>
            <View style={styles.textContainer}>
              <MotiText
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ duration: 600 }}
                style={styles.title}
              >
                {title}
              </MotiText>

              {subtitle ? (
                <MotiText
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 100, duration: 600 }}
                  style={styles.subtitle}
                >
                  {subtitle}
                </MotiText>
              ) : null}
            </View>
          </View>
        </View>

        {characterImage ? (
          <Image source={characterImage} style={styles.character} />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 1,
  },
  card: {
    width: '100%',
    height: BANNER_HEIGHT,
    maxHeight: BANNER_HEIGHT,
    position: 'relative',
    borderRadius: 26,
    overflow: 'visible',
  },
  background: {
    width: '100%',
    height: '100%',
    maxHeight: BANNER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundVideo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.25)',
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 76,
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 8,
  },
  character: {
    position: 'absolute',
    bottom: -16,
    right: -10,
    width: 140,
    height: 172,
    resizeMode: 'contain',
  },
})
