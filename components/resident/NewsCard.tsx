import { formatDate } from '@/lib/time'
import { AlertTriangle, Flame, Newspaper } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native'

interface NewsCardProps {
  id: string
  date: string
  title: string
  type: string
  onPress?: () => void
}

export default function NewsCard({ id, date, title, type, onPress }: NewsCardProps) {
  // 🎨 Colores según tipo
  const bgColors: Record<string, string> = {
    comunicado: '#ede9fe',
    advertencia: '#fef08a',
    emergencia: '#fee2e2',
  }

  const iconColors: Record<string, string> = {
    comunicado: '#7c3aed',
    advertencia: '#f59e0b',
    emergencia: '#ef4444',
  }

  // 📰 Íconos según tipo
  const icons = {
    comunicado: Newspaper,
    advertencia: AlertTriangle,
    emergencia: Flame, // reemplazo nativo de AlarmSmoke
  }

  const Icon = icons[type as keyof typeof icons] || Newspaper

  const colorScheme = useColorScheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.container,
        { backgroundColor: bgColors[type] || '#ede9fe' },
      ]}
    >
      {/* 🕒 Texto */}
      <View style={styles.textContainer}>
        <Text style={[styles.date, colorScheme === 'dark' && styles.dateDark]}>
          {formatDate(date)}
        </Text>
        <Text
          style={[styles.title, colorScheme === 'dark' && styles.titleDark]}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>

      {/* 🔸 Ícono circular */}
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: iconColors[type] || '#7c3aed' },
        ]}
      >
        <Icon size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
  dateDark: {
    color: '#9ca3af',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
    marginTop: 4,
    color: '#111827',
  },
  titleDark: {
    color: '#f3f4f6',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
})
