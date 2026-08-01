import type { CategoryId } from './categories'

export interface ClassEvent {
  id: string
  title: string
  /** ISO date string: YYYY-MM-DD */
  date: string
  /** Optional time string: HH:mm */
  time?: string
  category: CategoryId
  description?: string
  createdAt: number
}

export type EventDraft = Omit<ClassEvent, 'id' | 'createdAt'>
