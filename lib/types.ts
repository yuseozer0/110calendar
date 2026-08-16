import type { CategoryId } from './categories'

export type EventVisibility = 'class' | 'private'

export interface ClassEvent {
  id: string
  title: string
  /** Start date as an ISO date string: YYYY-MM-DD */
  date: string
  /** Optional inclusive end date for multi-day events. */
  endDate?: string
  /** Optional time string: HH:mm */
  time?: string
  category: CategoryId
  description?: string
  /** Compressed image stored with the schedule. */
  imageUrl?: string
  /** Show this event in the D-day area. */
  isDday?: boolean
  /** Pin this event as an important notice. */
  isPinned?: boolean
  /** Class schedules are public; private schedules are visible only to their owner. */
  visibility: EventVisibility
  /** Firebase Auth UID for private schedules. */
  ownerId?: string
  createdAt: number
}

export type EventDraft = Omit<ClassEvent, 'id' | 'createdAt' | 'ownerId'> & {
  imageFile?: File
  removeImage?: boolean
}
