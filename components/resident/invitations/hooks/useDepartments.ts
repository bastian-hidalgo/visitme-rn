import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export function useDepartments(userId?: string, communityId?: string) {
  const [departments, setDepartments] = useState<{ id: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || !communityId) return
    let cancelled = false

    const fetchDepartments = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('user_departments')
          .select('department_id, active, can_reserve, department:department_id(number, reservations_blocked)')
          .eq('user_id', userId)
          .eq('community_id', communityId)

        if (error) throw error

        const mapped = (data || [])
          .filter(r => r.active !== false)
          .filter(r => r.can_reserve !== false && r.department?.reservations_blocked !== true)
          .map(r => ({
            id: r.department_id,
            label: r.department?.number ? `Depto ${r.department.number}` : 'Departamento'
          }))
          .sort((a, b) => a.label.localeCompare(b.label, 'es'))

        if (!cancelled) setDepartments(mapped)
      } catch (err) {
        if (!cancelled) setError('No pudimos obtener tus departamentos. Intenta nuevamente.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDepartments()
    return () => { cancelled = true }
  }, [userId, communityId])

  return { departments, loading, error, reload: () => setDepartments([]) }
}
