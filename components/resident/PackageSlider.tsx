import { useResidentContext } from '@/components/contexts/ResidentContext'
import { Package } from 'lucide-react-native'
import { MotiView } from 'moti'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import PackageCard from './PackageCard'

export default function PackageSlider() {
  const { packages } = useResidentContext()
  const scrollX = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x
    },
  })

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 600 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tus Encomiendas</Text>
        <View style={styles.packageCount}>
          <Package size={22} color="#f97316" />
          <Text style={styles.packageCountText}>{packages.length}</Text>
        </View>
      </View>

      <Animated.FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={packages}
        keyExtractor={(item) => item.id.toString()}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <PackageCard parcel={item} index={index} scrollX={scrollX} />
        )}
        snapToInterval={300}
        decelerationRate="fast"
        bounces={false}
        contentContainerStyle={styles.listContent}
      />
    </MotiView>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', marginTop: 16 },
  listContent: { paddingHorizontal: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  packageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
})
