export interface Alert {
  id: string
  title: string
  message: string
  description: string
  created_at: string
  tags: string[]
  image_url?: string
  type: string
}
