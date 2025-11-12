import { supabase } from '@/lib/supabase'
import { formatDate, now, toServerUTC } from '@/lib/time'
import { useUser } from '@/providers/user-provider'
import type { Alert } from '@/types/alert'
import type { Parcel } from '@/types/parcel'
import type { Reservation } from '@/types/reservation'
import type { ResidentContextType } from '@/types/resident'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ResidentContext = createContext<ResidentContextType | undefined>(undefined)

export const ResidentProvider = ({ children }: { children: React.ReactNode }) => {
  const { communityId, id, loading: userLoading } = useUser()

  // 🔹 Datos principales
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [packages, setPackages] = useState<Parcel[]>([])
  const [surveys, setSurveys] = useState<any[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<any | null>(null)
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [alertDetail, setAlertDetailState] = useState<Alert | null>(null)

  // 🔹 Estados de paneles
  const [isSurveyPanelOpen, setSurveyPanelOpen] = useState(false)
  const [isFeedbackPanelOpen, setFeedbackPanelOpen] = useState(false)
  const [isInvitationPanelOpen, setInvitationPanelOpen] = useState(false)
  const [isPackagesPanelOpen, setPackagesPanelOpen] = useState(false)
  const [isAlertPanelOpen, setAlertPanelOpen] = useState(false)

  // 🔹 Cargas
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [loadingReservations, setLoadingReservations] = useState(true)
  const [loadingVisits, setLoadingVisits] = useState(true)
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [loadingSurveys, setLoadingSurveys] = useState(true)

  // 🔹 Abrir paneles / rutas
  const openSurveyPanel = () => setSurveyPanelOpen(true)
  const openFeedbackPanel = () => setFeedbackPanelOpen(true)
  const openInvitationPanel = () => setInvitationPanelOpen(true)
  const openPackagesPanel = () => setPackagesPanelOpen(true)
  const openAlertPanel = () => setAlertPanelOpen(true)
  const closeAlertPanel = useCallback(() => {
    setAlertPanelOpen(false)
    setAlertDetailState(null)
  }, [])

  // 🔹 Cerrar todos los paneles
  const closePanels = useCallback(() => {
    setSurveyPanelOpen(false)
    setFeedbackPanelOpen(false)
    setInvitationPanelOpen(false)
    setPackagesPanelOpen(false)
    setSelectedSurvey(null)
    closeAlertPanel()
  }, [closeAlertPanel])

  const resetCommunityData = useCallback(
    (options?: { loadingState?: boolean }) => {
      const loadingState = options?.loadingState ?? false

      setAlerts([])
      setReservations([])
      setVisits([])
      setPackages([])
      setSurveys([])
      setSelectedSurvey(null)
      setSelectedParcel(null)
      setAlertDetailState(null)

      setSurveyPanelOpen(false)
      setFeedbackPanelOpen(false)
      setInvitationPanelOpen(false)
      setPackagesPanelOpen(false)
      setAlertPanelOpen(false)

      setLoadingAlerts(loadingState)
      setLoadingReservations(loadingState)
      setLoadingVisits(loadingState)
      setLoadingPackages(loadingState)
      setLoadingSurveys(loadingState)
    },
    []
  )

  // 🔹 Estado combinado
  const isAnyPanelOpen =
    isSurveyPanelOpen ||
    isFeedbackPanelOpen ||
    isInvitationPanelOpen ||
    isPackagesPanelOpen ||
    isAlertPanelOpen

  // 🔹 Encuestas
  const refreshSurveys = useCallback(async () => {
    if (!id || !communityId) return
    setLoadingSurveys(true)

    const { data: userDepartments } = await supabase
      .from('user_departments')
      .select('department_id')
      .eq('user_id', id)
      .eq('community_id', communityId)

    if (!userDepartments) {
      setSurveys([])
      setLoadingSurveys(false)
      return
    }

    const departmentIds = userDepartments.map((d) => d.department_id)
    const [{ data: surveysData }, { data: responses }] = await Promise.all([
      supabase
        .from('surveys')
        .select('*, survey_questions(*)')
        .eq('community_id', communityId)
        .eq('status', 'activa')
        .gt('expires_at', toServerUTC(now())),
      supabase
        .from('survey_responses')
        .select('survey_id, department_id')
        .in('department_id', departmentIds),
    ])

    const respondedSurveyIds = new Set(responses?.map((r) => r.survey_id))
    const enriched = (surveysData || []).map((s) => ({
      ...s,
      alreadyAnswered: respondedSurveyIds.has(s.id),
    }))

    setSurveys(enriched)
    setLoadingSurveys(false)
  }, [communityId, id])

  // 🔹 Alertas (API pública)
  const fetchAlerts = useCallback(async () => {
    if (!communityId) {
      setAlerts([])
      setLoadingAlerts(false)
      return
    }

    setLoadingAlerts(true)
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('id, title, message, created_at, tags, image_url, type')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const normalized = (data || []).map<Alert>((alert) => ({
        id: alert.id,
        title: alert.title ?? 'Aviso importante',
        message: alert.message ?? '',
        description: alert.message ?? '',
        created_at: alert.created_at ?? now().toISOString(),
        tags: alert.tags ?? [],
        image_url: alert.image_url ?? undefined,
        type: alert.type ?? 'comunicado',
      }))

      setAlerts(normalized)
    } catch (e) {
      console.error('Error al cargar alertas:', e)
      setAlerts([])
    } finally {
      setLoadingAlerts(false)
    }
  }, [communityId])

  // 🔹 Reservas
  const fetchReservations = useCallback(async () => {
    if (!communityId || !id) {
      setReservations([])
      setLoadingReservations(false)
      return
    }

    setLoadingReservations(true)
    try {
      const { data, error } = await supabase
        .from('common_space_reservations_with_user')
        .select('*')
        .eq('community_id', communityId)
        .eq('reserved_by', id)
        .gte('date', toServerUTC(now().startOf('day')))
        .order('date', { ascending: true })
        .limit(10)

      if (error) throw error

      setReservations((data as Reservation[]) || [])
    } catch (e) {
      console.error('Error al cargar reservas:', e)
      setReservations([])
    } finally {
      setLoadingReservations(false)
    }
  }, [communityId, id])

  // 🔹 Visitas
  const fetchVisits = useCallback(async () => {
    if (!id || !communityId) return
    setLoadingVisits(true)
    try {
      const twoWeeksAgo = now().subtract(14, 'day')
      const { data: userDepartments } = await supabase
        .from('user_departments')
        .select('department_id')
        .eq('user_id', id)
        .eq('community_id', communityId)

      const departmentIds = userDepartments?.map((d) => d.department_id) || []

      const { data } = await supabase
        .from('visits')
        .select('*')
        .eq('community_id', communityId)
        .in('department_id', departmentIds)
        .gte('scheduled_at', toServerUTC(twoWeeksAgo))
        .order('scheduled_at', { ascending: false })

      const formatted = (data || []).map((v) => ({
        ...v,
        scheduled_at: formatDate(v.scheduled_at),
      }))
      setVisits(formatted)
    } catch (e) {
      console.error('Error al cargar visitas:', e)
    } finally {
      setLoadingVisits(false)
    }
  }, [communityId, id])

  // 🔹 Paquetes
  const fetchPackages = useCallback(async () => {
    if (!id || !communityId) return
    setLoadingPackages(true)
    try {
      const twoWeeksAgo = now().subtract(14, 'day')
      const { data: userDepartments } = await supabase
        .from('user_departments')
        .select('department_id')
        .eq('user_id', id)
        .eq('community_id', communityId)

      const departmentIds = userDepartments?.map((d) => d.department_id) || []

      const { data } = await supabase
        .from('parcels')
        .select('*, department:department_id(number)')
        .eq('community_id', communityId)
        .in('department_id', departmentIds)
        .neq('status', 'cancelled')
        .gte('created_at', toServerUTC(twoWeeksAgo))
        .order('created_at', { ascending: false })

      setPackages(((data as Parcel[]) || []).map((parcel) => ({
        ...parcel,
        department: parcel.department ?? (parcel as any).department,
      })))
    } catch (e) {
      console.error('Error al cargar paquetes:', e)
    } finally {
      setLoadingPackages(false)
    }
  }, [communityId, id])

  // 🔹 Cargar todo en montaje
  useEffect(() => {
    if (userLoading) return

    const shouldShowLoading = Boolean(id && communityId)
    resetCommunityData({ loadingState: shouldShowLoading })

    if (!id || !communityId) return

    const loadAll = () => {
      fetchAlerts()
      fetchReservations()
      fetchVisits()
      fetchPackages()
      refreshSurveys()
    }

    loadAll()
    const interval = setInterval(loadAll, 60000)
    return () => clearInterval(interval)
  }, [
    userLoading,
    id,
    communityId,
    fetchAlerts,
    fetchReservations,
    fetchVisits,
    fetchPackages,
    refreshSurveys,
    resetCommunityData,
  ])

  // ✅ Contexto
  return (
    <ResidentContext.Provider
      value={{
        // 🔹 Datos
        alerts,
        reservations,
        visits,
        packages,
        surveys,
        selectedSurvey,
        selectedParcel,
        alertDetail,

        // 🔹 Estado de paneles
        isSurveyPanelOpen,
        isFeedbackPanelOpen,
        isInvitationPanelOpen,
        isPackagesPanelOpen,
        isAlertPanelOpen,
        isAnyPanelOpen,

        // 🔹 Cargas
        loadingSurveys,
        loadingAlerts,
        loadingReservations,
        loadingVisits,
        loadingPackages,

        // 🔹 Fetchers
        fetchAlerts,
        fetchReservations,
        fetchVisits,
        fetchPackages,
        refreshSurveys,
        resetCommunityData,

        // 🔹 Control de paneles
        openSurveyPanel,
        openFeedbackPanel,
        openInvitationPanel,
        openAlertPanel,
        openPackagesPanel,
        closeAlertPanel,

        // 🔹 Cierre general
        closePanels,

        // 🔹 Estado auxiliar
        setSelectedSurvey,
        setAlertDetail: setAlertDetailState,
        setParcelDetail: setSelectedParcel,
        setLoadingAlerts,
      }}
    >
      {children}
    </ResidentContext.Provider>
  )
}

export const useResidentContext = () => {
  const ctx = useContext(ResidentContext)
  if (!ctx) throw new Error('useResidentContext debe usarse dentro de ResidentProvider')
  return ctx
}
