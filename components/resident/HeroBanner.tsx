import { getHeroBannerData } from '@/lib/getHeroBannerData'
import { MotiText } from 'moti'
import React from 'react'
import { Image, ImageBackground, StyleSheet, View } from 'react-native'

interface HeroBannerProps {
  reservationStatus: 'none' | 'upcoming' | 'tomorrow' | 'post'
  reservationDate?: string
}

export default function HeroBanner({ reservationStatus, reservationDate }: HeroBannerProps) {
  const { title, subtitle, backgroundImage, characterImage } =
    getHeroBannerData(reservationStatus, reservationDate)

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          style={styles.background}
          imageStyle={styles.backgroundImage}
        >
          <View style={styles.overlay} />

          {/* Contenido principal */}
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
        </ImageBackground>

        {/* Personaje ilustrado */}
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
    marginTop: 4,
  },
  card: {
    position: 'relative',
    borderRadius: 28,
    overflow: 'visible',
    minHeight: 136,
  },
  background: {
    flex: 1,
    minHeight: 136,
    borderRadius: 28,
  },
  backgroundImage: {
    borderRadius: 28,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 28,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 84,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 8,
  },
  character: {
    position: 'absolute',
    bottom: -28,
    right: -6,
    width: 148,
    height: 180,
    resizeMode: 'contain',
  },
})
