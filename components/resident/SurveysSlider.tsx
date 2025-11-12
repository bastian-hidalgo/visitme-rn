import { useResidentContext } from '@/components/contexts/ResidentContext'
import { ClipboardList } from 'lucide-react-native'
import { MotiView } from 'moti'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import SurveyCard from './SurveyCard'

export default function SurveysSlider() {
  const { surveys, openSurveyPanel, setSelectedSurvey } = useResidentContext()
  const scrollX = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x
    },
  })

  const handleClick = (survey: any) => {
    setSelectedSurvey(survey)
    openSurveyPanel()
  }

  if (!surveys?.length) return null

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 600 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Participa y comparte tu opinión</Text>
          <Text style={styles.headerTitle}>Encuestas activas</Text>
        </View>
        <View style={styles.surveyCount}>
          <ClipboardList size={22} color="#6D28D9" />
          <Text style={styles.surveyCountText}>{surveys.length}</Text>
        </View>
      </View>

      {/* Slider horizontal */}
      <Animated.FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={surveys}
        keyExtractor={(item) => item.id ?? Math.random().toString()}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <SurveyCard
            key={item.id ?? index}
            title={item.title}
            description={item.description}
            expiresAt={item.expires_at}
            disabled={item.alreadyAnswered}
            onClick={() => !item.alreadyAnswered && handleClick(item)}
          />
        )}
        snapToInterval={250}
        decelerationRate="fast"
        bounces={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </MotiView>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', marginTop: 16, backgroundColor: 'transparent' },
  listContent: {
    paddingLeft: 0,
    paddingRight: 16,
  },
  separator: {
    width: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerEyebrow: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  surveyCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  surveyCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
})
