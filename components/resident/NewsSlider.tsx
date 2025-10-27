import { useResidentContext } from '@/components/contexts/ResidentContext'
import SkeletonCard from '@/components/ui/SkeletonCard'
import type { Alert } from '@/types/alert'
import { MotiView } from 'moti'
import React from 'react'
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native'
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
        <Text style={[styles.title, styles.titleCompact]}>
          Lo último
        </Text>
        <Text style={styles.subtitle}>No hay alertas recientes.</Text>
      </View>
    )
  }

  // 🔹 Definimos el tipo explícito del item
  type FlatListItem = Alert | { skeleton: true; id: string }

  const data: FlatListItem[] = loadingAlerts
    ? Array.from({ length: 3 }).map((_, i) => ({ skeleton: true, id: `skeleton-${i}` }))
    : alerts

  const cardWidth = Math.max(Math.min(width - 120, 320), 220)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lo último</Text>

      <FlatList<FlatListItem>
        horizontal
        pagingEnabled
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          if ('skeleton' in item) {
            return (
              <View style={{ width: cardWidth, marginRight: 14 }}>
                <SkeletonCard height={86} width={cardWidth} />
              </View>
            )
          }

          return (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 500 }}
              style={{ width: cardWidth, marginRight: 14 }}
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
    paddingHorizontal: 4,
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
