// components/EmptyPackages.tsx
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

export default function EmptyPackages() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/img/empty-locker.webp')}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>No tienes encomiendas</Text>
      <Text style={styles.subtitle}>Te avisaremos cuando llegue algo nuevo</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32
  },
  image: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
})
