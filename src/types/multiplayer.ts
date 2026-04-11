import type { Timestamp } from 'firebase/firestore'

export type ActivityType = 'unusual_uses' | 'similarities' | 'differences'
export type SessionStatus = 'waiting' | 'active' | 'finished'

export type PlayerData = {
  displayName: string
  photoURL: string
  score: number
  answers: string[]
  ready: boolean
}

export type MultiplayerSession = {
  activityType: ActivityType
  status: SessionStatus
  hostId: string
  word?: string
  object1?: string
  object2?: string
  createdAt: Timestamp
  startedAt?: Timestamp
  players: Record<string, PlayerData>
}
