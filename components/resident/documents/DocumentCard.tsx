import { formatDocumentSize, getCommunityDocumentCategoryLabel, type CommunityDocument } from '@/lib/community-documents'
import { format, fromNow } from '@/lib/time'
import { CalendarDays, Download, Eye, FileText, Share } from 'lucide-react-native'
import React, { useCallback } from 'react'
import { Alert, Linking, Pressable, Share as NativeShare, StyleSheet, Text, View } from 'react-native'

interface DocumentCardProps {
  document: CommunityDocument
}

const openLink = async (url: string) => {
  try {
    const canOpen = await Linking.canOpenURL(url)
    if (!canOpen) {
      Alert.alert('No se pudo abrir el enlace')
      return
    }
    await Linking.openURL(url)
  } catch (error) {
    console.error('Error abriendo documento', error)
    Alert.alert('No se pudo abrir el documento')
  }
}

export default function DocumentCard({ document }: DocumentCardProps) {
  const { title, description, category, file_size, file_url, published_at, updated_at, created_at } = document

  const publishedReference = published_at || created_at
  const publishedLabel = publishedReference ? format(publishedReference, 'DD MMM YYYY') : 'Sin fecha definida'
  const hasUpdates = Boolean(updated_at && (!published_at || updated_at !== published_at))
  const updatedLabel = hasUpdates ? fromNow(updated_at as string) : null

  const handleShare = useCallback(async () => {
    try {
      await NativeShare.share({ url: file_url, message: `${title} - ${file_url}` })
    } catch (error) {
      console.error('No se pudo compartir el documento', error)
      Alert.alert('No se pudo compartir el documento')
    }
  }, [file_url, title])

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <FileText size={18} color="#5b21b6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.chip}>{getCommunityDocumentCategoryLabel(category)}</Text>
            <Text style={styles.sizeChip}>{formatDocumentSize(file_size)}</Text>
          </View>
        </View>
        <Pressable accessibilityLabel="Compartir" onPress={handleShare} style={styles.shareButton}>
          <Share size={18} color="#6b21a8" />
        </Pressable>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {description?.trim() || 'Sin descripción disponible.'}
      </Text>

      <View style={styles.dates}>
        <View style={styles.dateRow}>
          <CalendarDays size={16} color="#6b7280" />
          <Text style={styles.dateText}>Publicado: {publishedLabel}</Text>
        </View>
        {updatedLabel && <Text style={styles.updated}>Actualizado {updatedLabel}</Text>}
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.ghostButton]} onPress={() => openLink(file_url)}>
          <Eye size={16} color="#6b21a8" />
          <Text style={styles.ghostLabel}>Ver</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.primaryButton]} onPress={() => openLink(file_url)}>
          <Download size={16} color="#fff" />
          <Text style={styles.primaryLabel}>Descargar</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: 'rgba(17, 24, 39, 0.08)',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    fontSize: 12,
    color: '#6b21a8',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '700',
  },
  sizeChip: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '600',
  },
  shareButton: {
    padding: 6,
  },
  description: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
  },
  dates: {
    gap: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
  },
  updated: {
    color: '#9ca3af',
    fontStyle: 'italic',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ghostButton: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    shadowColor: 'rgba(124, 58, 237, 0.35)',
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  ghostLabel: {
    color: '#6b21a8',
    fontWeight: '700',
    fontSize: 14,
  },
  primaryLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
})
