import type { Alert } from './alert'
import type { Parcel } from './parcel'
import type { Reservation } from './reservation'
import type { Database } from './supabase'

export interface ResidentContextType {
  // 🔹 Datos principales
  alerts: Alert[]
  reservations: Reservation[]
  visits: Database['public']['Tables']['visits']['Row'][]
  packages: Parcel[]
  surveys: any[]
  selectedSurvey: any | null
  selectedParcel: Parcel | null
  selectedReservation: Reservation | null
  alertDetail: Alert | null
  residentDepartments: { department_id: string; label: string }[]

  // 🔹 Estado de paneles
  isSurveyPanelOpen: boolean
  isFeedbackPanelOpen: boolean
  isInvitationPanelOpen: boolean
  isAnyPanelOpen: boolean
  isPackagesPanelOpen: boolean
  isAlertPanelOpen: boolean
  isReservationPanelOpen: boolean

  // 🔹 Cargas
  loadingSurveys: boolean
  loadingAlerts: boolean
  loadingReservations: boolean
  loadingVisits: boolean
  loadingPackages: boolean

  // 🔹 Acciones principales (fetch)
  fetchAlerts: () => void
  fetchReservations: (showAll?: boolean) => void
  fetchVisits: () => void
  fetchPackages: () => void
  refreshSurveys: () => Promise<void>
  refreshAll: () => Promise<void>
  resetCommunityData: (options?: { loadingState?: boolean }) => void

  // 🔹 Control de paneles
  openSurveyPanel: () => void
  openFeedbackPanel: () => void
  openInvitationPanel: () => void
  openAlertPanel: () => void
  openPackagesPanel: () => void
  openReservationPanel: () => void
  closeAlertPanel: () => void
  closePanels: () => void

  // 🔹 Estado auxiliar
  setSelectedSurvey: (survey: any | null) => void
  setAlertDetail: (alert: Alert | null) => void
  setLoadingAlerts: (loading: boolean) => void
  setParcelDetail: (parcel: Parcel | null) => void
  setReservationDetail: (reservation: Reservation | null) => void
  setReservationPanelOpen: (open: boolean) => void
  setPendingParcelId: (id: string | null) => void
  setPendingAlertId: (id: string | null) => void
}
