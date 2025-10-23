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
    borderRadius: 24,
    overflow: 'visible',
    minHeight: 170,
  },
  background: {
    flex: 1,
    minHeight: 170,
    borderRadius: 24,
  },
  backgroundImage: {
    borderRadius: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 110,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 15,
    marginTop: 6,
  },
  character: {
    position: 'absolute',
    bottom: -8,
    right: -4,
    width: 140,
    height: 170,
    resizeMode: 'contain',
  },
})
