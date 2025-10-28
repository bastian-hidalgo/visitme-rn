import * as Clipboard from 'expo-clipboard'
import { CalendarDays, Car, Copy, Share2, UsersRound } from 'lucide-react-native'
import { MotiView } from 'moti'
import React, { useState } from 'react'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'

interface InvitedCardProps {
  scheduled_at: string | null
  visitor_name: string
  license_plate?: string | null
  guests?: number | null 
  code: string
  secret_code?: string | null
  onPress?: () => void
}

export default function InvitedCard({
  scheduled_at,
  visitor_name,
  license_plate,
  guests = 1,
  code,
  secret_code,
  onPress
}: InvitedCardProps) {
  const [copied, setCopied] = useState(false)
  const INVITATION_BASE_URL = process.env.EXPO_BASE_URL || 'https://app.visitme.cl'
  const url = `${INVITATION_BASE_URL}/v/${code}`

  const handleCopy = async () => {
    await Clipboard.setStringAsync(url)
    Toast.show({
      type: 'success',
      text1: 'Enlace copiado al portapapeles',
    })
    setCopied(true)
  }

  const whatsappMessage = `Hola ${visitor_name}, te invité a mi departamento.

Preséntate en portería con este enlace:
${url}

Si te lo piden, el código secreto es: ${secret_code || '—'}.

Nos vemos!`

  const handleShare = () => {
    const encoded = encodeURIComponent(whatsappMessage)
    const link = `https://wa.me/?text=${encoded}`
    Linking.openURL(link)
  }

  const formattedDate = scheduled_at ?? 'Sin fecha'

  return (
    <MotiView
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 450 }}
      style={styles.container}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.touchable}
      >
        <View style={styles.header}>
          <View style={styles.dateBadge}>
            <CalendarDays size={14} color="#4c1d95" />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <Text style={styles.visitorName} numberOfLines={2}>
            {visitor_name}
          </Text>
        </View>

        <View style={styles.metaSection}>
          <View style={styles.metaBadge}>
            <UsersRound size={16} color="#4c1d95" />
            <Text style={styles.metaText}>{guests ?? 1} invitado{(guests ?? 1) > 1 ? 's' : ''}</Text>
          </View>
          {license_plate && (
            <View style={styles.metaBadge}>
              <Car size={16} color="#4c1d95" />
              <Text style={styles.metaText}>{license_plate}</Text>
            </View>
          )}
          <View style={styles.metaBadge}>
            <Text style={styles.metaLabel}>Código</Text>
            <Text style={styles.metaText}>{code}</Text>
          </View>
          {secret_code && (
            <View style={styles.metaBadge}>
              <Text style={styles.metaLabel}>Secreto</Text>
              <Text style={styles.metaText}>{secret_code}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.divider} />

      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.85}
          style={styles.primaryAction}
        >
          <Share2 size={16} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.85}
          style={[styles.secondaryAction, copied && styles.secondaryActionDisabled]}
        >
          <Copy size={16} color="#4c1d95" />
          <Text style={styles.secondaryActionText}>{copied ? 'Copiado' : 'Copiar enlace'}</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    width: 220,
    minHeight: 220,
    justifyContent: 'space-between',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  touchable: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  header: {
    gap: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3730a3',
  },
  visitorName: {
    color: '#1f2937',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
  },
  metaSection: {
    marginTop: 16,
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338ca',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaText: {
    fontSize: 13,
    color: '#4338ca',
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e0e7ff',
    marginHorizontal: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#4c1d95',
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    paddingVertical: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  secondaryActionDisabled: {
    opacity: 0.5,
  },
  secondaryActionText: {
    color: '#4338ca',
    fontWeight: '600',
    fontSize: 13,
  },
})
