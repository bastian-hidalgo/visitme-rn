import { getHeroBannerData } from '@/lib/getHeroBannerData'
import { MotiText } from 'moti'
import React from 'react'
import { Dimensions, Image, ImageBackground, StyleSheet, View } from 'react-native'

interface HeroBannerProps {
  reservationStatus: 'none' | 'upcoming' | 'tomorrow' | 'post'
  reservationDate?: string
}

const { width } = Dimensions.get('window')

export default function HeroBanner({ reservationStatus, reservationDate }: HeroBannerProps) {
  const { title, subtitle, backgroundImage, characterImage } =
    getHeroBannerData(reservationStatus, reservationDate)

  return (
    <View style={styles.container}>
      {/* Fondo */}
      <ImageBackground
        source={{ uri: backgroundImage }}
        resizeMode="cover"
        style={{
          width: width - 32,
          height: 180,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Sombra oscura para contraste de texto */}
        <View style={styles.overlay} />

        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Textos */}
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

          {/* Personaje ilustrado */}
          {characterImage ? (
            <Image
              source={{ uri: characterImage }}
              style={{
                width: 120,
                height: 120,
                resizeMode: 'contain',
                marginLeft: 8,
              }}
            />
          ) : null}
        </View>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    marginVertical: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 4,
  },
})
