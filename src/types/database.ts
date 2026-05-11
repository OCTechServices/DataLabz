export type VisibilityStatus = 'online' | 'away' | 'offline'
export type RoomStatus = 'active' | 'paused' | 'frozen' | 'closed'
export type WorldTheme = 'pixel-dark' | 'pixel-light' | 'glam'

export interface Milestone {
  id: string
  text: string
  done: boolean
}

export interface RoomLink {
  id: string
  label: string
  url: string
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  visibility: VisibilityStatus
  theme: WorldTheme
  custom_css: string | null
  updated_at: string
}

export interface Room {
  id: string
  name: string
  creator_id: string
  venue_id: string | null
  stack_tags: string[]
  milestones: Milestone[]
  links: RoomLink[]
  session: number
  status: RoomStatus
  closes_at: string
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  name: string
  code: string
  address: string | null
  lat: number | null
  lng: number | null
  active: boolean
  created_at: string
}

export interface CheckIn {
  id: string
  user_id: string
  venue_id: string
  token: string
  expires_at: string
  created_at: string
}

export interface ActiveCheckIn extends CheckIn {
  venues: Pick<Venue, 'id' | 'name' | 'code'>
}

export interface RoomMember {
  room_id: string
  user_id: string
  role: 'creator' | 'collaborator'
  joined_at: string
}

export interface RoomWithCreator extends Room {
  profiles: Pick<Profile, 'display_name' | 'avatar_url'>
  member_count: number
}
