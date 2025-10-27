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
  alertDetail: Alert | null

  // 🔹 Estado de paneles
  isSurveyPanelOpen: boolean
  isFeedbackPanelOpen: boolean
  isInvitationPanelOpen: boolean
  isReservationPanelOpen: boolean
  isAnyPanelOpen: boolean
  isPackagesPanelOpen?: boolean // 👈 opcional si solo se usa en algunos contextos
  isAlertPanelOpen?: boolean

  // 🔹 Cargas
  loadingSurveys: boolean
  loadingAlerts: boolean
  loadingReservations: boolean
  loadingVisits: boolean
  loadingPackages: boolean

  // 🔹 Acciones principales (fetch)
  fetchAlerts: () => void
  fetchReservations: () => void
  fetchVisits: () => void
  fetchPackages: () => void
  refreshSurveys: () => Promise<void>

  // 🔹 Control de paneles
  openSurveyPanel: () => void
  openFeedbackPanel: () => void
  openInvitationPanel: () => void
  openAlertPanel: () => void
  openPackagesPanel: () => void // ✅ agregado
  openReservationPanel: () => void
  closeAlertPanel: () => void
  closeReservationPanel: () => void
  closePanels: () => void

  // 🔹 Estado auxiliar
  setSelectedSurvey: (survey: any | null) => void
  setAlertDetail: (alert: Alert | null) => void
  setLoadingAlerts: (loading: boolean) => void
  setParcelDetail: (parcel: Parcel | null) => void // ✅ agregado
}
