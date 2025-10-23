import { useResidentContext } from '@/components/contexts/ResidentContext'
import { Package } from 'lucide-react-native'
import { MotiView } from 'moti'
import React from 'react'
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native'
import PackageCard from './PackageCard'

const { width } = Dimensions.get('window')

export default function PackageSlider() {
  const { packages } = useResidentContext()

  const cardWidth = Math.min(Math.max(width - 88, 220), 280)

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 600 }}
      style={styles.container}
    >
      {/* 🔹 Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tus Encomiendas</Text>
        <View style={styles.packageCount}>
          <Package size={24} color="#f97316" />
          <Text style={styles.packageCountText}>{packages.length}</Text>
        </View>
      </View>

      {/* 🔹 Carrusel horizontal */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={packages}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, { width: cardWidth }]}> 
            <PackageCard parcel={item} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tienes encomiendas.</Text>
          </View>
        )}
      />
    </MotiView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 16,
  },
  listContent: {
    paddingLeft: 4,
    paddingRight: 8,
    paddingBottom: 4,
  },
  cardWrapper: {
    overflow: 'visible',
  },
  separator: {
    width: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  packageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageCountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptyState: {
    width: '100%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
  },
})
