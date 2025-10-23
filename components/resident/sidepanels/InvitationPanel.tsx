import ActionButton from '@/components/resident/ActionButton'
import { ExternalLink, UserPlus } from 'lucide-react-native'
import React from 'react'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Modal from 'react-native-modal'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const getWebUrl = (path: string) => {
  const baseUrl = process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://app.visitme.cl'
  return `${baseUrl}${path}`
}

export default function InvitationPanel({ isOpen, onClose }: Props) {

  const handleOpenWeb = () => {
    const url = getWebUrl('/invitados')
    Linking.openURL(url).catch((error) => {
      console.error('No fue posible abrir la versión web de invitados', error)
    })
  }

  return (
    <Modal
      isVisible={isOpen}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="slideInRight"
      animationOut="slideOutRight"
      backdropTransitionOutTiming={0}
      style={{ margin: 0, justifyContent: 'flex-end' }}
    >
      <View style={styles.panel}>
        <View style={styles.header}>
          <UserPlus size={22} color="#f97316" />
          <Text style={styles.title}>Invita a tus visitas</Text>
        </View>

        <Text style={styles.description}>
          Estamos trabajando para que puedas crear invitaciones desde la app. Mientras tanto,
          continúa gestionándolas desde la versión web de VisitMe.
        </Text>

        <View style={styles.actions}>
          <ActionButton text="Crear invitación en la web" icon={ExternalLink} onPress={handleOpenWeb} />
          <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
            <Text style={styles.secondaryLabel}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#ffffff',
    height: '100%',
    width: '85%',
    marginLeft: 'auto',
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
