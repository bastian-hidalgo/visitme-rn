import { useResidentContext } from '@/components/contexts/ResidentContext'
import { MotiView } from 'moti'
import React from 'react'
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import SurveyCard from './SurveyCard'

const { width } = Dimensions.get('window')

export default function SurveysSlider() {
  const { surveys, openSurveyPanel, setSelectedSurvey } = useResidentContext()

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
        <Text style={styles.headerTitle}>Encuestas activas</Text>
      </View>

      {/* Slider horizontal */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={surveys}
        keyExtractor={(item) => item.id ?? Math.random().toString()}
        renderItem={({ item }) => (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 400 }}
            style={{
              width: width * 0.75,
              marginRight: 16,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={item.alreadyAnswered}
              onPress={() => !item.alreadyAnswered && handleClick(item)}
            >
              <SurveyCard
                title={item.title}
                description={item.description}
                expiresAt={item.expires_at}
                disabled={item.alreadyAnswered}
              />
            </TouchableOpacity>
          </MotiView>
        )}
        contentContainerStyle={{ paddingLeft: 0, paddingRight: 16, paddingBottom: 10 }}
      />
    </MotiView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 16,
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
})
