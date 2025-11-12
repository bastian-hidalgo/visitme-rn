import { useResidentContext } from '@/components/contexts/ResidentContext'
import SkeletonCard from '@/components/ui/SkeletonCard'
import type { Alert } from '@/types/alert'
import { MotiView } from 'moti'
import React from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import NewsCard from './NewsCard'

const { width } = Dimensions.get('window')

export default function NewsSlider() {
  const { alerts, openAlertPanel, setAlertDetail, loadingAlerts } =
    useResidentContext()

  const handleShowAlertDetail = (alertId: string) => {
    openAlertPanel()

    try {
      const alert = alerts.find((a) => a.id === alertId)
      if (alert) setAlertDetail(alert)
    } catch (error) {
      console.error('Error al cargar alerta:', error)
    }
  }

  if (alerts.length === 0 && !loadingAlerts) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, styles.titleCompact]}>Lo último</Text>
        <Text style={styles.subtitle}>No hay alertas recientes.</Text>
      </View>
    )
  }

  // 🔹 Tipo del item (alerta o skeleton)
  type FlatListItem = Alert | { skeleton: true; id: string }

  const data: FlatListItem[] = loadingAlerts
    ? Array.from({ length: 3 }).map((_, i) => ({
        skeleton: true,
        id: `skeleton-${i}`,
      }))
    : alerts

  // 🔹 Ancho base de cada card (igual que otros sliders)
  const cardWidth = 300
  const separatorWidth = 12

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lo último</Text>

      <Animated.FlatList<FlatListItem>
        horizontal
        showsHorizontalScrollIndicator={false}
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        snapToInterval={cardWidth + separatorWidth} // 👈 paso exacto por card
        decelerationRate="fast"
        bounces={false}
        renderItem={({ item, index }) => {
          if ('skeleton' in item) {
            return (
              <View style={{ width: cardWidth, marginRight: separatorWidth }}>
                <SkeletonCard height={120} width={cardWidth} />
              </View>
            )
          }

          return (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 500 }}
              style={{ width: cardWidth, marginRight: separatorWidth }}
            >
              <NewsCard
                id={item.id}
                date={item.created_at}
                title={item.title}
                message={item.message}
                type={item.type}
                onPress={() => handleShowAlertDetail(item.id)}
              />
            </MotiView>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 16,
  },
  listContent: {
    paddingLeft: 0,
    paddingRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  titleCompact: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
})
