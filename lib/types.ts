import type { CategoryId } from './categories'

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
  /** Show this event in the D-day area. */
  isDday?: boolean
  /** Pin this event as an important notice. */
  isPinned?: boolean
  createdAt: number
}

export type EventDraft = Omit<ClassEvent, 'id' | 'createdAt'>
