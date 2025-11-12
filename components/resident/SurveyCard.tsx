import { formatDateLogical } from '@/lib/time'
import { CalendarDays, CheckCircle2, ClipboardList } from 'lucide-react-native'
import { MotiView } from 'moti'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface SurveyCardProps {
  title: string
  description?: string
  expiresAt: string
  onClick?: () => void
  disabled?: boolean
}

export default function SurveyCard({
  title,
  description,
  expiresAt,
  onClick,
  disabled = false,
}: SurveyCardProps) {
  const formattedDate = formatDateLogical(expiresAt)

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 400 }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={!disabled ? onClick : undefined}
        disabled={disabled}
        style={[
          styles.card,
          disabled ? styles.cardDisabled : styles.cardEnabled,
        ]}
      >
        <View style={styles.content}>
          {/* Fecha de cierre */}
          <View
            style={[
              styles.dateBadge,
              disabled ? styles.dateBadgeDisabled : styles.dateBadgeEnabled,
            ]}
          >
            <CalendarDays
              size={14}
              color={disabled ? '#4B5563' : '#6D28D9'}
            />
            <Text
              style={[
                styles.dateText,
                disabled ? styles.disabledText : styles.enabledText,
              ]}
            >
              Cierra: {formattedDate}
            </Text>
          </View>

          {/* Título */}
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[
              styles.title,
              disabled ? styles.disabledText : styles.enabledText,
            ]}
          >
            {title}
          </Text>

          {/* Descripción */}
          <Text
            numberOfLines={3}
            ellipsizeMode="tail"
            style={[
              styles.description,
              disabled ? styles.disabledText : styles.enabledText,
            ]}
          >
            {description || 'Sin descripción'}
          </Text>

          {/* Ícono decorativo */}
          <View
            style={[
              styles.iconWrapper,
              disabled ? styles.iconWrapperDisabled : styles.iconWrapperEnabled,
            ]}
          >
            {disabled ? (
              <CheckCircle2 size={20} color="#4B5563" />
            ) : (
              <ClipboardList size={20} color="#6D28D9" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 250,
    height: 160, // 👈 alto fijo para que todas midan igual
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardEnabled: {
    backgroundColor: '#ede9fe',
  },
  cardDisabled: {
    backgroundColor: '#e5e7eb',
    opacity: 0.5,
  },
  content: {
    width: '100%',
    gap: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  dateBadgeEnabled: {
    backgroundColor: '#c4b5fd',
  },
  dateBadgeDisabled: {
    backgroundColor: '#d1d5db',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  enabledText: {
    color: '#5b21b6',
  },
  disabledText: {
    color: '#4b5563',
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'left',
    width: '100%',
  },
  description: {
    fontSize: 12,
    textAlign: 'left',
    width: '100%',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  iconWrapperEnabled: {
    backgroundColor: '#c4b5fd',
  },
  iconWrapperDisabled: {
    backgroundColor: '#d1d5db',
  },
})
