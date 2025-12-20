import { useResidentContext } from '@/components/contexts/ResidentContext'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import React, { useEffect, useRef } from 'react'
import NewsDetailSheet from './NewsDetailSheet'

export default function NewsDetailModal() {
  const { alertDetail, isAlertPanelOpen, closeAlertPanel } = useResidentContext()
  const bottomSheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (isAlertPanelOpen && alertDetail) {
      console.log(`[NewsDetailModal] 🏁 Presenting sheet for alert: ${alertDetail.id}`)
      bottomSheetRef.current?.present()
    } else {
      if (isAlertPanelOpen) console.log('[NewsDetailModal] ⚠️ Panel open but NO alertDetail')
      bottomSheetRef.current?.dismiss()
    }
  }, [isAlertPanelOpen, alertDetail])

  return (
    <NewsDetailSheet
      ref={bottomSheetRef}
      alert={alertDetail}
      onClose={closeAlertPanel}
    />
  )
}
