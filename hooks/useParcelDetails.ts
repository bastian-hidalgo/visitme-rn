import type { Parcel } from '@/types/parcel'
import { useState } from 'react'

/**
 * Hook liviano sólo para manejar el panel de detalle (sin fetch ni supabase).
 * Ideal para la app móvil del residente.
 */
export function useParcelDetails() {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)

  const handleOpenDetails = (parcel: Parcel) => {
    setSelectedParcel(null)
    setPhotoLoading(true)
    setIsDetailsOpen(true)
    // pequeño delay para animación
    setTimeout(() => {
      setSelectedParcel(parcel)
      setPhotoLoading(false)
    }, 250)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setSelectedParcel(null)
  }

  return {
    // estado
    isDetailsOpen,
    selectedParcel,
    photoLoading,

    // acciones
    setIsDetailsOpen,
    setSelectedParcel,
    handleOpenDetails,
    handleCloseDetails,
  }
}
