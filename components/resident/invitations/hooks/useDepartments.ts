import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export function useDepartments(userId?: string, communityId?: string) {
  const [departments, setDepartments] = useState<
    { id: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !communityId) return;
    let cancelled = false;

    const fetchDepartments = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("user_departments")
          .select("department_id, active, can_reserve")
          .eq("user_id", userId)
          .eq("community_id", communityId);

        if (error) throw error;

        const departmentIds = (data || []).map((r) => r.department_id);
        const { data: departmentDetails, error: departmentError } =
          departmentIds.length
            ? await supabase
                .from("departments")
                .select("id, number, reservations_blocked")
                .in("id", departmentIds)
            : { data: [], error: null };

        if (departmentError) throw departmentError;

        const detailsById = new Map(
          (departmentDetails || []).map((department) => [
            department.id,
            department,
          ]),
        );

        const mapped = (data || [])
          .filter((r) => r.active !== false)
          .filter(
            (r) =>
              r.can_reserve !== false &&
              detailsById.get(r.department_id)?.reservations_blocked !== true,
          )
          .map((r) => {
            const department = detailsById.get(r.department_id);
            return {
              id: r.department_id,
              label: department?.number
                ? `Depto ${department.number}`
                : "Departamento",
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label, "es"));

        if (!cancelled) setDepartments(mapped);
      } catch {
        if (!cancelled)
          setError("No pudimos obtener tus departamentos. Intenta nuevamente.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDepartments();
    return () => {
      cancelled = true;
    };
  }, [userId, communityId]);

  return { departments, loading, error, reload: () => setDepartments([]) };
}
