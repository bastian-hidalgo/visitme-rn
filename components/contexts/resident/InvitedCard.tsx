import { getBaseUrl } from '@/lib/getBaseUrl'
import * as Clipboard from 'expo-clipboard'
import { Car, Copy, Share2, UsersRound } from 'lucide-react-native'
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
  const url = `${getBaseUrl()}/v/${code}`

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

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 500 }}
      style={styles.container}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.contentButton}
      >
        <View style={styles.info}>
          {/* Fecha */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>
              {scheduled_at ? scheduled_at : 'Sin fecha'}
            </Text>
          </View>

          {/* Nombre */}
          <Text style={styles.visitorName}>
            {visitor_name}
          </Text>

          {/* Patente */}
          {license_plate && (
            <View style={styles.licenseBadge}>
              <Text style={styles.licenseText}>{license_plate}</Text>
            </View>
          )}

          {/* Íconos */}
          <View style={styles.iconRow}>
            <View style={styles.iconBubble}>
              <UsersRound size={18} color="#4c1d95" />
              <Text style={styles.guestsText}>
                {guests}
              </Text>
            </View>
            {license_plate && (
              <View style={styles.iconBubble}>
                <Car size={18} color="#4c1d95" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Botones inferiores */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.8}
          style={styles.shareButton}
        >
          <Share2 size={14} color="#fff" />
          <Text style={styles.shareButtonText}>Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.8}
          style={[styles.copyButton, copied && styles.copyButtonDisabled]}
        >
          <Copy size={14} color="#4c1d95" />
          <Text style={styles.copyButtonText}>
            {copied ? 'Copiado' : 'Copiar'}
          </Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ede9fe',
    width: 140,
    height: 200,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 4,
  },
  contentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  info: {
    alignItems: 'center',
    gap: 8,
  },
  dateBadge: {
    backgroundColor: '#c4b5fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5b21b6',
  },
  visitorName: {
    color: '#5b21b6',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  licenseBadge: {
    backgroundColor: '#ddd6fe',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  licenseText: {
    fontSize: 12,
    color: '#5b21b6',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  iconBubble: {
    width: 32,
    height: 32,
    backgroundColor: '#c4b5fd',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  guestsText: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 10,
    fontWeight: '600',
    color: '#5b21b6',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#5b21b6',
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 12,
    marginLeft: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c4b5fd',
    paddingVertical: 6,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  copyButtonDisabled: {
    opacity: 0.6,
  },
  copyButtonText: {
    color: '#4338ca',
    fontSize: 12,
    marginLeft: 4,
  },
})
