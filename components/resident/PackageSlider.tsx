import { useResidentContext } from '@/components/contexts/ResidentContext'
import { useParcelDetails } from '@/hooks/useParcelDetails'
import type { Parcel } from '@/types/parcel'
import { Package } from 'lucide-react-native'
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
import PackageCard from './PackageCard'

const { width } = Dimensions.get('window')

export default function PackageSlider() {
  const { packages, openPackagesPanel } = useResidentContext()
  const { handleOpenDetails } = useParcelDetails()
  const colorScheme = useColorScheme()

  const handleSelectPackage = (pkg: Parcel) => {
    handleOpenDetails(pkg)
    openPackagesPanel()
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 600 }}
      style={styles.container}
    >
      {/* 🔹 Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, colorScheme === 'dark' && styles.headerTitleDark]}>
          Tus Encomiendas
        </Text>
        <View style={styles.packageCount}>
          <Package size={24} color="#f97316" />
          <Text style={[styles.packageCountText, colorScheme === 'dark' && styles.packageCountTextDark]}>
            {packages.length}
          </Text>
        </View>
      </View>

      {/* 🔹 Carrusel horizontal */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={packages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleSelectPackage(item)}
            style={{ width: width * 0.7, marginRight: 16 }}
          >
            <PackageCard parcel={item} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, colorScheme === 'dark' && styles.emptyStateTextDark]}>
              No tienes encomiendas.
            </Text>
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
    paddingHorizontal: 16,
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
  headerTitleDark: {
    color: '#ffffff',
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
  packageCountTextDark: {
    color: '#d1d5db',
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
  emptyStateTextDark: {
    color: '#9ca3af',
  },
})
