import ActionButton from '@/components/resident/ActionButton'
import { CalendarDays, ExternalLink } from 'lucide-react-native'
import React from 'react'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import SidePanelContainer from './SidePanelContainer'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const getWebUrl = (path: string) => {
  const baseUrl = process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://app.visitme.cl'
  return `${baseUrl}${path}`
}

export default function ReservationPanel({ isOpen, onClose }: Props) {
  const handleOpenWeb = () => {
    const url = getWebUrl('/reservas')
    Linking.openURL(url).catch((error) => {
      console.error('No fue posible abrir la versión web de reservas', error)
    })
  }

  return (
    <SidePanelContainer isOpen={isOpen} onClose={onClose}>
      {({ close }) => (
        <View style={styles.panel}>
          <View style={styles.header}>
            <CalendarDays size={22} color="#f97316" />
            <Text style={styles.title}>Gestiona tus reservas</Text>
          </View>

          <Text style={styles.description}>
            Muy pronto podrás agendar y administrar tus reservas directamente desde la app. Mientras tanto,
            puedes usar la versión web para completar el proceso.
          </Text>

          <View style={styles.actions}>
            <ActionButton text="Agendar en la web" icon={ExternalLink} onPress={handleOpenWeb} />
            <TouchableOpacity
              onPress={() => {
                void close()
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryLabel}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SidePanelContainer>
  )
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#ffffff',
    height: '100%',
    width: '100%',
    padding: 24,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
    marginBottom: 24,
  },
  actions: {
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7e22ce',
  },
})
