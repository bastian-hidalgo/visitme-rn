export interface Parcel {
  id: string
  community_id: string | null
  department_id: string | null
  created_at: string | null
  photo_url: string | null
  picked_up_at: string | null
  quantity: number
  signature_url: string | null
  status: string | null
  department?: {
    number?: string | null
  } | null
}
