import { useResidentContext } from '@/components/contexts/ResidentContext'
import { format, fromNow } from '@/lib/time'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import React, { useMemo } from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { AlertTriangle, Flame, Newspaper, Tag, X } from 'lucide-react-native'

const ICONS = {
  comunicado: Newspaper,
  advertencia: AlertTriangle,
  emergencia: Flame,
}

const HEADER_COLORS: Record<string, { background: string; accent: string }> = {
  comunicado: { background: '#4C1D95', accent: '#A855F7' },
  advertencia: { background: '#92400E', accent: '#F59E0B' },
  emergencia: { background: '#991B1B', accent: '#EF4444' },
}

const FALLBACK_IMAGE = 'https://www.visitme.cl/img/placeholder-news.webp'

export default function NewsDetailModal() {
  const {
    alertDetail,
    isAlertPanelOpen,
    closeAlertPanel,
  } = useResidentContext()

  const isVisible = Boolean(isAlertPanelOpen && alertDetail)

  const handleClose = () => {
    closeAlertPanel()
  }

  const type = alertDetail?.type ?? 'comunicado'
  const Icon = ICONS[type as keyof typeof ICONS] ?? Newspaper
  const palette = HEADER_COLORS[type] ?? HEADER_COLORS.comunicado
  const createdAtLabel = useMemo(
    () => (alertDetail ? format(alertDetail.created_at, 'DD MMM YYYY • HH:mm') : ''),
    [alertDetail],
  )
  const createdRelative = useMemo(
    () => (alertDetail ? fromNow(alertDetail.created_at) : ''),
    [alertDetail],
  )

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={handleClose} />
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 250 }}
          style={styles.modal}
        >
          <View style={styles.heroContainer}>
            {alertDetail?.image_url ? (
              <Image
                source={{ uri: alertDetail.image_url ?? FALLBACK_IMAGE }}
                style={styles.heroImage}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[palette.background, '#1F2937']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroImage}
              />
            )}
            <LinearGradient
              colors={['rgba(17, 24, 39, 0.85)', 'rgba(17, 24, 39, 0.4)', 'transparent']}
              locations={[0, 0.6, 1]}
              style={styles.heroOverlay}
            />
            <View style={styles.heroContent}>
              <View style={[styles.iconWrapper, { backgroundColor: palette.accent }]}> 
                <Icon size={22} color="#fff" />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.typeLabel}>{type}</Text>
                <Text style={styles.title}>{alertDetail?.title ?? 'Aviso importante'}</Text>
                <Text style={styles.date}>{createdAtLabel}</Text>
                {createdRelative ? (
                  <Text style={styles.relative}>{createdRelative}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {alertDetail?.tags?.length ? (
              <View style={styles.tagsContainer}>
                {alertDetail.tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Tag size={14} color={palette.accent} />
                    <Text style={[styles.tagText, { color: palette.accent }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {alertDetail?.message ? (
              <View style={styles.section}>
                {alertDetail.message
                  .split('\n')
                  .filter((paragraph) => paragraph.trim().length)
                  .map((paragraph, index) => (
                    <Text key={index.toString()} style={styles.paragraph}>
                      {paragraph.trim()}
                    </Text>
                  ))}
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.paragraph}>
                  Mantente atento a las próximas actualizaciones de tu comunidad.
                </Text>
              </View>
            )}
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modal: {
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '88%',
  },
  heroContainer: {
    position: 'relative',
    height: 220,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 60,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  typeLabel: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1.5,
    color: '#e5e7eb',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  date: {
    fontSize: 13,
    color: '#f3f4f6',
  },
  relative: {
    marginTop: 2,
    fontSize: 12,
    color: '#cbd5f5',
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2937',
  },
})
