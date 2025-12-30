import { supabase } from '@/lib/supabase'
import { formatDate, now, toServerUTC } from '@/lib/time'
import { useUser } from '@/providers/user-provider'
import type { Alert } from '@/types/alert'
import type { Parcel } from '@/types/parcel'
import type { Reservation } from '@/types/reservation'
import type { ResidentContextType } from '@/types/resident'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

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
  const [selectedParcel, setSelectedParcelState] = useState<Parcel | null>(null)
  
  const setSelectedParcel = useCallback((parcel: Parcel | null) => {
    console.log(`[ResidentContext] 📦 setSelectedParcel called with: ${parcel ? parcel.id : 'null'}`)
    setSelectedParcelState(parcel)
  }, [])

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [alertDetail, setAlertDetailState] = useState<Alert | null>(null)
  const [residentDepartments, setResidentDepartments] = useState<
    { department_id: string; label: string }[]
  >([])
  const [pendingParcelId, setPendingParcelId] = useState<string | null>(null)
  const [pendingAlertId, setPendingAlertId] = useState<string | null>(null)
  const [pendingReservationId, setPendingReservationId] = useState<string | null>(null)
  
  const setPendingParcelIdMemoized = useCallback((id: string | null) => {
    console.log(`[ResidentContext] 📝 setPendingParcelId CALLED with: ${id}`)
    setPendingParcelId(id)
  }, [])

  const setPendingAlertIdMemoized = useCallback((id: string | null) => {
    console.log(`[ResidentContext] 📝 setPendingAlertId CALLED with: ${id}`)
    setPendingAlertId(id)
  }, [])

  const setPendingReservationIdMemoized = useCallback((id: string | null) => {
    console.log(`[ResidentContext] 📝 setPendingReservationId CALLED with: ${id}`)
    setPendingReservationId(id)
  }, [])

  // 🔹 Estados de paneles
  const [isSurveyPanelOpen, setSurveyPanelOpen] = useState(false)
  const [isFeedbackPanelOpen, setFeedbackPanelOpen] = useState(false)
  const [isInvitationPanelOpen, setInvitationPanelOpen] = useState(false)
  const [isPackagesPanelOpen, setPackagesPanelOpen] = useState(false)
  const [isAlertPanelOpen, setAlertPanelOpen] = useState(false)
  const [isReservationPanelOpen, setReservationPanelOpen] = useState(false)

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
  const openReservationPanel = () => setReservationPanelOpen(true)
  const closeAlertPanel = useCallback(() => {
    setAlertPanelOpen(false)
    setAlertDetailState(null)
  }, [])

  const closeReservationPanel = useCallback(() => {
    setReservationPanelOpen(false)
    setSelectedReservation(null)
  }, [])

  // 🔹 Cerrar todos los paneles
  const closePanels = useCallback(() => {
    setSurveyPanelOpen(false)
    setFeedbackPanelOpen(false)
    setInvitationPanelOpen(false)
    setPackagesPanelOpen(false)
    setSelectedSurvey(null)
    closeAlertPanel()
    closeReservationPanel()
  }, [closeAlertPanel, closeReservationPanel])

  const resetCommunityData = useCallback(
    (options?: { loadingState?: boolean }) => {
      const loadingState = options?.loadingState ?? false

      setAlerts([])
      setReservations([])
      setVisits([])
      setPackages([])
      setSurveys([])
      setResidentDepartments([])
      setSelectedSurvey(null)
      setSelectedParcelState(null)
      setAlertDetailState(null)
      setSelectedReservation(null)

      setSurveyPanelOpen(false)
      setFeedbackPanelOpen(false)
      setInvitationPanelOpen(false)
      setPackagesPanelOpen(false)
      setAlertPanelOpen(false)
      setReservationPanelOpen(false)

      setLoadingAlerts(loadingState)
      setLoadingReservations(loadingState)
      setLoadingVisits(loadingState)
      setLoadingPackages(loadingState)
      setLoadingSurveys(loadingState)
    },
    [setSelectedParcelState]
  )

  // 🔹 Estado combinado
  const isAnyPanelOpen =
    isSurveyPanelOpen ||
    isFeedbackPanelOpen ||
    isInvitationPanelOpen ||
    isPackagesPanelOpen ||
    isAlertPanelOpen ||
    isReservationPanelOpen

  // 🔹 Encuestas
  const refreshSurveys = useCallback(async () => {
    if (!id || !communityId) {
      setSurveys([])
      setResidentDepartments([])
      return
    }

    setLoadingSurveys(true)

    try {
      // 1) Validar que el communityId actual SI pertenezca al usuario
      const { data: validCommunities, error: vcError } = await supabase
        .from('user_communities')
        .select('community_id')
        .eq('user_id', id)

      if (vcError) {
        console.error("Error validando comunidades del usuario:", vcError)
        setSurveys([])
        setResidentDepartments([])
        return
      }

      const validCommunityIds = validCommunities?.map(c => c.community_id) ?? []
      const isValidCommunity = validCommunityIds.includes(communityId)

      if (!isValidCommunity) {
        console.warn("communityId inválido para este usuario:", communityId)
        setSurveys([])
        setResidentDepartments([])
        return
      }

      // 2) Obtener departamentos activos del usuario usando la view
      const { data: deptRows, error: deptError } = await supabase
        .from('users_with_departments')
        .select('department_id, department_number')
        .eq('id', id)
        .eq('community_id', communityId)

      if (deptError) {
        console.error("Error al cargar departamentos del residente:", deptError)
        setSurveys([])
        setResidentDepartments([])
        return
      }

      if (!deptRows || deptRows.length === 0) {
        setSurveys([])
        setResidentDepartments([])
        return
      }

      const normalizedDepartments = deptRows.map(row => ({
        department_id: row.department_id,
        label: row.department_number
          ? `Depto ${row.department_number}`
          : `Departamento ${row.department_id}`,
      }))

      setResidentDepartments(normalizedDepartments)

      const departmentIds = deptRows.map(row => row.department_id)



      // 4) Obtener encuestas de la comunidad actual
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

      setSurveys(
        enriched.filter((s) => !s.alreadyAnswered)
      )

    } catch (error) {
      console.error("Error al cargar encuestas:", error)
      setSurveys([])
      setResidentDepartments([])
    } finally {
      setLoadingSurveys(false)
    }

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
  const fetchReservations = useCallback(async (showAll: boolean = false) => {
    if (!communityId || !id) {
      setReservations([])
      setLoadingReservations(false)
      return
    }

    setLoadingReservations(true)
    try {
      // 1) Obtener departamentos vinculados al usuario
      const { data: userDepts } = await supabase
        .from('user_departments')
        .select('department_id')
        .eq('user_id', id)
        .eq('community_id', communityId)

      const deptIds = userDepts?.map(d => d.department_id) || []

      let query = supabase
        .from('common_space_reservations_with_user')
        .select('*, common_spaces:common_space_id(requires_consent, consent_text)')
        .eq('community_id', communityId)
        .in('department_id', deptIds)

      if (!showAll) {
        // Para el dashboard, traemos desde hace 7 días hasta el futuro
        const sevenDaysAgo = now().subtract(7, 'day')
        query = query.gte('date', formatDate(sevenDaysAgo))
      }

      console.log(`[ResidentContext] 🛠 Fetching reservations for user ${id} in community ${communityId} (showAll: ${showAll})`)
      const { data, error } = await query
        .order('date', { ascending: false })
        .limit(showAll ? 50 : 40)

      if (error) {
        console.error('[ResidentContext] ❌ Error fetching reservations:', error)
        throw error
      }

      console.log(`[ResidentContext] ✅ Fetched ${data?.length || 0} reservations:`, data?.map(r => ({ id: r.id, date: r.date, status: r.status })))
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

  const hasRefreshedForPending = useRef(false)
  const hasRefreshedForAlert = useRef(false)

  // 🔹 Auto-selección de paquete pendiente
  useEffect(() => {
    // Si no hay ID pendiente o estamos cargando, no hacemos nada
    if (loadingPackages || !pendingParcelId) return

    console.log(`[ResidentContext] 🔍 Searching for pending parcel ${pendingParcelId} (count: ${packages.length})...`)
    const found = packages.find(p => String(p.id) === String(pendingParcelId))
    
    if (found) {
      console.log(`[ResidentContext] ✅ FOUND MATCH! Parcel ID: ${found.id}. Setting selectedParcel.`)
      setSelectedParcel(found)
      setPendingParcelId(null) // Reset handler
      hasRefreshedForPending.current = false // Reset for next time
    } else {
      // ⚠️ Si no está en la lista y no hemos refrescado todavía, intentamos UN refresh
      if (!hasRefreshedForPending.current) {
        console.log(`[ResidentContext] 🔄 Parcel ${pendingParcelId} NOT found. Triggering REFRESH...`)
        hasRefreshedForPending.current = true
        fetchPackages()
      } else {
        console.log(`[ResidentContext] ❌ Parcel ${pendingParcelId} NOT found even after refresh. giving up.`)
        // Opcional: Podríamos limpiar el pendingId aquí para no seguir intentando
        setPendingParcelId(null)
      }
    }
  }, [loadingPackages, packages, pendingParcelId, fetchPackages, setSelectedParcel])

  // 🔹 Auto-selección de alerta pendiente
  useEffect(() => {
    if (loadingAlerts || !pendingAlertId) return

    console.log(`[ResidentContext] 🔍 Searching for pending alert ${pendingAlertId} (count: ${alerts.length})...`)
    const found = alerts.find(a => String(a.id) === String(pendingAlertId))
    
    if (found) {
      console.log(`[ResidentContext] ✅ FOUND MATCH! Alert ID: ${found.id}. Setting alertDetail and opening panel.`)
      setAlertDetailState(found)
      setAlertPanelOpen(true)
      setPendingAlertId(null)
      hasRefreshedForAlert.current = false
    } else {
      if (!hasRefreshedForAlert.current) {
        console.log(`[ResidentContext] 🔄 Alert ${pendingAlertId} NOT found. Triggering REFRESH...`)
        hasRefreshedForAlert.current = true
        fetchAlerts()
      } else {
        console.log(`[ResidentContext] ❌ Alert ${pendingAlertId} NOT found even after refresh. giving up.`)
        setPendingAlertId(null)
      }
    }
  }, [loadingAlerts, alerts, pendingAlertId, fetchAlerts])

  const refreshAll = useCallback(async () => {
    if (!id || !communityId) {
      return
    }

    try {
      await Promise.all([
        fetchAlerts(),
        fetchReservations(),
        fetchVisits(),
        fetchPackages(),
        refreshSurveys(),
      ])
    } catch (error) {
      console.error('Error al refrescar datos del residente:', error)
    }
  }, [
    communityId,
    fetchAlerts,
    fetchPackages,
    fetchReservations,
    fetchVisits,
    id,
    refreshSurveys,
  ])

  const hasRefreshedForReservation = useRef(false)

  // 🔹 Auto-selección de reserva pendiente
  useEffect(() => {
    if (loadingReservations || !pendingReservationId) return

    console.log(`[ResidentContext] 🔍 Searching for pending reservation ${pendingReservationId} (count: ${reservations.length})...`)
    const found = reservations.find(r => String(r.id) === String(pendingReservationId))
    
    if (found) {
      console.log(`[ResidentContext] ✅ FOUND MATCH! Reservation ID: ${found.id}. Setting selectedReservation and opening panel.`)
      setSelectedReservation(found)
      setReservationPanelOpen(true)
      setPendingReservationId(null)
      hasRefreshedForReservation.current = false
    } else {
      if (!hasRefreshedForReservation.current) {
        console.log(`[ResidentContext] 🔄 Reservation ${pendingReservationId} NOT found. Triggering REFRESH...`)
        hasRefreshedForReservation.current = true
        fetchReservations()
      } else {
        console.log(`[ResidentContext] ❌ Reservation ${pendingReservationId} NOT found even after refresh. giving up.`)
        setPendingReservationId(null)
      }
    }
  }, [loadingReservations, reservations, pendingReservationId, fetchReservations])

  // 🔹 Cargar todo en montaje
  useEffect(() => {
    if (userLoading) return

    const shouldShowLoading = Boolean(id && communityId)
    resetCommunityData({ loadingState: shouldShowLoading })

    if (!id || !communityId) return

    refreshAll()
  }, [communityId, id, refreshAll, resetCommunityData, userLoading])

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
        selectedReservation,
        alertDetail,
        residentDepartments,

        // 🔹 Estado de paneles
        isSurveyPanelOpen,
        isFeedbackPanelOpen,
        isInvitationPanelOpen,
        isPackagesPanelOpen,
        isAlertPanelOpen,
        isReservationPanelOpen,
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
        refreshAll,
        resetCommunityData,

        // 🔹 Control de paneles
        openSurveyPanel,
        openFeedbackPanel,
        openInvitationPanel,
        openAlertPanel,
        openPackagesPanel,
        openReservationPanel,
        closeAlertPanel,

        // 🔹 Cierre general
        closePanels,

        // 🔹 Estado auxiliar
        setSelectedSurvey,
        setAlertDetail: setAlertDetailState,
        setParcelDetail: setSelectedParcel,
        setReservationDetail: setSelectedReservation,
        setReservationPanelOpen,
        setLoadingAlerts,
        setPendingParcelId: setPendingParcelIdMemoized,
        setPendingAlertId: setPendingAlertIdMemoized,
        setPendingReservationId: setPendingReservationIdMemoized,
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
