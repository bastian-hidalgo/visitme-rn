import { supabase } from '@/lib/supabase/client'
import { formatDate, now, toServerUTC } from '@/lib/time'
import { useUser } from '@/providers/UserProvider'
import type { Reservation } from '@/types/reservation'
import type { ResidentContextType } from '@/types/resident'
import React, { createContext, useContext, useEffect, useState } from 'react'

const ResidentContext = createContext<ResidentContextType | undefined>(undefined)

export const ResidentProvider = ({ children }: { children: React.ReactNode }) => {
  const { communityId, id, loading: userLoading } = useUser()

  // 🔹 Datos principales
  const [alerts, setAlerts] = useState<any[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [surveys, setSurveys] = useState<any[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<any | null>(null)

  // 🔹 Estados de paneles
  const [isSurveyPanelOpen, setSurveyPanelOpen] = useState(false)
  const [isFeedbackPanelOpen, setFeedbackPanelOpen] = useState(false)
  const [isInvitationPanelOpen, setInvitationPanelOpen] = useState(false)

  // 🔹 Cargas
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [loadingReservations, setLoadingReservations] = useState(true)
  const [loadingVisits, setLoadingVisits] = useState(true)
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [loadingSurveys, setLoadingSurveys] = useState(true)

  // 🔹 Abrir paneles
  const openSurveyPanel = () => setSurveyPanelOpen(true)
  const openFeedbackPanel = () => setFeedbackPanelOpen(true)
  const openInvitationPanel = () => setInvitationPanelOpen(true)

  // 🔹 Cerrar todos los paneles
  const closePanels = () => {
    setSurveyPanelOpen(false)
    setFeedbackPanelOpen(false)
    setInvitationPanelOpen(false)
  }

  // 🔹 Estado combinado
  const isAnyPanelOpen = isSurveyPanelOpen || isFeedbackPanelOpen || isInvitationPanelOpen

  // 🔹 Encuestas
  const refreshSurveys = async () => {
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
  }

  // 🔹 Alertas (API pública)
  const fetchAlerts = async () => {
    setLoadingAlerts(true)
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_URL_API}/api/alerts?community_id=${communityId}`
      )
      const data = await response.json()
      if (response.ok) setAlerts(data)
    } catch (e) {
      console.error('Error al cargar alertas:', e)
    } finally {
      setLoadingAlerts(false)
    }
  }

  // 🔹 Reservas
  const fetchReservations = async () => {
    setLoadingReservations(true)
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_URL_API}/api/users/reservations?onlyFuture=true&communityId=${communityId}`
      )
      const data = await res.json()
      if (res.ok) {
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateA - dateB
        })
        setReservations(sorted)
      }
    } catch (e) {
      console.error('Error al cargar reservas:', e)
    } finally {
      setLoadingReservations(false)
    }
  }

  // 🔹 Visitas
  const fetchVisits = async () => {
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
  }

  // 🔹 Paquetes
  const fetchPackages = async () => {
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

      setPackages(data || [])
    } catch (e) {
      console.error('Error al cargar paquetes:', e)
    } finally {
      setLoadingPackages(false)
    }
  }

  // 🔹 Cargar todo en montaje
  useEffect(() => {
    if (userLoading || !id || !communityId) return
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
  }, [userLoading, id, communityId])

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

        // 🔹 Estado de paneles
        isSurveyPanelOpen,
        isFeedbackPanelOpen,
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

        // 🔹 Control de paneles
        openSurveyPanel,
        openFeedbackPanel,
        openInvitationPanel,
        openAlertPanel: () => {
          // ⚙️ Si tienes un panel real en el futuro, aquí puedes abrirlo
          console.log('openAlertPanel() llamado')
        },
        openPackagesPanel: () => {
          // ⚙️ Si tienes un panel real en el futuro, aquí puedes abrirlo
          console.log('openPackagesPanel() llamado')
        },
        openReservationPanel: () => {
          // ⚙️ Si tienes un panel real en el futuro, aquí puedes abrirlo
          console.log('openReservationPanel() llamado')
        },

        // 🔹 Cierre general
        closePanels,

        // 🔹 Estado auxiliar
        setSelectedSurvey,
        setAlertDetail: (alert) => {
          console.log('setAlertDetail', alert)
        },
        setParcelDetail: (parcel) => {
          console.log('setParcelDetail', parcel)
        },
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
