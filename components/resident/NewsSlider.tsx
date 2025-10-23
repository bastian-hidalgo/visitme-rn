import { useResidentContext } from '@/components/contexts/ResidentContext'
import SkeletonCard from '@/components/ui/SkeletonCard'
import type { Alert } from '@/types/alert'
import { MotiView } from 'moti'
import React from 'react'
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'
import NewsCard from './NewsCard'

const { width } = Dimensions.get('window')

export default function NewsSlider() {
  const {
    alerts,
    openAlertPanel,
    setAlertDetail,
    setLoadingAlerts,
    loadingAlerts,
  } = useResidentContext()

  const colorScheme = useColorScheme()

  const handleShowAlertDetail = async (alertId: string) => {
    openAlertPanel()
    setLoadingAlerts(true)

    try {
      const alert = alerts.find((a) => a.id === alertId)
      if (alert) setAlertDetail(alert)
    } catch (error) {
      console.error('Error al cargar alerta:', error)
    } finally {
      setLoadingAlerts(false)
    }
  }

  if (alerts.length === 0 && !loadingAlerts) {
    return (
      <View style={styles.container}>
        <Text
          style={[styles.title, styles.titleCompact, colorScheme === 'dark' && styles.titleDark]}
        >
          Lo último
        </Text>
        <Text style={[styles.subtitle, colorScheme === 'dark' && styles.subtitleDark]}>
          No hay alertas recientes.
        </Text>
      </View>
    )
  }

  // 🔹 Definimos el tipo explícito del item
  type FlatListItem = Alert | { skeleton: true; id: string }

  const data: FlatListItem[] = loadingAlerts
    ? Array.from({ length: 3 }).map((_, i) => ({ skeleton: true, id: `skeleton-${i}` }))
    : alerts

  return (
    <View style={styles.container}>
      <Text style={[styles.title, colorScheme === 'dark' && styles.titleDark]}>
        Lo último
      </Text>

      <FlatList<FlatListItem>
        horizontal
        pagingEnabled
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          if ('skeleton' in item) {
            return (
              <View style={{ width: width - 96, marginRight: 16 }}>
                <SkeletonCard height={86} width={width - 96} />
              </View>
            )
          }

          return (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 500 }}
              style={{ width: width - 96, marginRight: 16 }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleShowAlertDetail(item.id)}
              >
                <NewsCard
                  id={item.id}
                  date={item.created_at}
                  title={item.title}
                  type={item.type}
                />
              </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  titleCompact: {
    marginBottom: 8,
  },
  titleDark: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  subtitleDark: {
    color: '#9ca3af',
  },
})
