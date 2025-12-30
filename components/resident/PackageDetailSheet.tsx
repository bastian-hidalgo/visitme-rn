import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import React, { forwardRef, useCallback } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export type PackageStatusLabel = 'Recibida' | 'Retirada' | 'Esperando' | 'Anulada'

export type PackageDetailSheetProps = {
  imageUrl: string
  status: PackageStatusLabel
  apartment?: string
  date: string
  receivedAtLabel?: string
  receivedRelativeLabel?: string
  pickedUpAtLabel?: string | null
  pickedUpRelativeLabel?: string | null
  signatureImageUrl?: string | null
  signatureCompleted?: boolean
  detailDescription?: string
  onClose?: () => void
}

export const PackageDetailSheet = forwardRef<BottomSheetModal, PackageDetailSheetProps>(
  (
    {
      imageUrl,
      status,
      apartment,
      date,
      receivedAtLabel,
      receivedRelativeLabel,
      pickedUpAtLabel,
      pickedUpRelativeLabel,
      signatureImageUrl,
      signatureCompleted,
      detailDescription,
      onClose,
    },
    ref
  ) => {
    React.useEffect(() => {
      console.log('[PackageDetailSheet] 📦 Full Props Debug:', {
        imageUrl,
        status,
        apartment,
        date,
        receivedAtLabel,
        receivedRelativeLabel,
        pickedUpAtLabel,
        pickedUpRelativeLabel,
        signatureImageUrl,
        signatureCompleted,
        detailDescription,
      })
    }, [imageUrl, status, apartment, date, receivedAtLabel, receivedRelativeLabel, pickedUpAtLabel, pickedUpRelativeLabel, signatureImageUrl, signatureCompleted, detailDescription])

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.6}
          style={{ backgroundColor: 'rgba(15,23,42,0.65)' }}
        />
      ),
      []
    )

    const handleDismiss = useCallback(() => {
        console.log('[PackageDetailSheet] 💨 onDismiss triggered')
        onClose?.()
    }, [onClose])

    React.useEffect(() => {
      console.log(`[PackageDetailSheet] 🎭 Mounted with status: ${status}, apartment: ${apartment}`)
      return () => console.log('[PackageDetailSheet] 🎭 Unmounted')
    }, [status, apartment])

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={['90%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        onDismiss={handleDismiss}
        animateOnMount
        stackBehavior="push"
      >
        <BottomSheetScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
          <Image source={{ uri: imageUrl }} style={styles.sheetImage} contentFit="cover" />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{status}</Text>
            {apartment ? (
              <Text style={styles.sheetSubTitle}>Departamento {apartment}</Text>
            ) : (
              <Text style={styles.sheetSubTitle}>Encomienda</Text>
            )}
            <Text style={styles.sheetDate}>{date}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionBody}>
              {detailDescription ??
                (status === 'Retirada'
                  ? 'Esta encomienda ya fue retirada de conserjería.'
                  : 'Tu encomienda está disponible para retiro en conserjería.')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Movimientos</Text>
            <View style={styles.timeline}>
              <View style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Llegó a conserjería</Text>
                  <Text style={styles.timelineValue}>{receivedAtLabel ?? 'Sin registro'}</Text>
                  {receivedRelativeLabel ? (
                    <Text style={styles.timelineHint}>{receivedRelativeLabel}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.timelineRow}>
                <View
                  style={[
                    styles.timelineDot,
                    signatureCompleted || pickedUpAtLabel
                      ? styles.timelineDotCompleted
                      : styles.timelineDotPending,
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>
                    {pickedUpAtLabel ? 'Retirada por el residente' : 'Pendiente de retiro'}
                  </Text>
                  <Text style={styles.timelineValue}>
                    {pickedUpAtLabel ?? 'Aún disponible en conserjería'}
                  </Text>
                  {pickedUpRelativeLabel ? (
                    <Text style={styles.timelineHint}>{pickedUpRelativeLabel}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Firma</Text>
            {signatureCompleted ? (
              <View style={styles.signatureContainer}>
                {signatureImageUrl ? (
                  <Image source={{ uri: signatureImageUrl }} style={styles.signatureImage} contentFit="contain" />
                ) : (
                  <Text style={styles.signatureConfirmedText}>Firma confirmada</Text>
                )}
                <Text style={styles.signatureCaption}>Firma registrada al retirar</Text>
              </View>
            ) : (
              <View style={styles.signaturePlaceholder}>
                <Text style={styles.signatureText}>Se solicitará al retirar</Text>
              </View>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    )
  }
)

PackageDetailSheet.displayName = 'PackageDetailSheet'

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: '#cbd5e1',
    width: 40,
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sheetImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  sheetHeader: {
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#6B4EFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sheetSubTitle: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  sheetDate: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionBody: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  timeline: {
    gap: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: '#6B4EFF',
  },
  timelineDotCompleted: {
    backgroundColor: '#10b981',
  },
  timelineDotPending: {
    backgroundColor: '#f59e0b',
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineValue: {
    fontSize: 14,
    color: '#374151',
  },
  timelineHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  signaturePlaceholder: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(107, 78, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 78, 255, 0.05)',
  },
  signatureText: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '600',
  },
  signatureContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  signatureImage: {
    width: '100%',
    height: 120,
  },
  signatureConfirmedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
  },
  signatureCaption: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
})
