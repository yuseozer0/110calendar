'use client'

import { Flag, Pencil, Pin } from 'lucide-react'
import { CategoryBadge } from '@/components/category-badge'
import { Button } from '@/components/ui/button'
import {
  dateKeyInRange,
  daysBetween,
  formatDateRange,
  getEventEndDate,
} from '@/lib/date-utils'
import type { ClassEvent } from '@/lib/types'

interface EventHighlightsProps {
  ddayEvents: ClassEvent[]
  pinnedEvents: ClassEvent[]
  todayKey: string
  canManage?: boolean
  onEdit?: (event: ClassEvent) => void
}

function getDdayLabel(event: ClassEvent, todayKey: string): string {
  const endDate = getEventEndDate(event)
  if (todayKey < event.date) return `D-${daysBetween(todayKey, event.date)}`
  if (dateKeyInRange(todayKey, event)) {
    return event.date === endDate ? 'D-Day' : '진행 중'
  }
  return `D+${daysBetween(endDate, todayKey)}`
}

export function EventHighlights({
  ddayEvents,
  pinnedEvents,
  todayKey,
  canManage = false,
  onEdit,
}: EventHighlightsProps) {
  if (ddayEvents.length === 0 && pinnedEvents.length === 0) return null

  return (
    <div className="mb-4 grid gap-4 xl:grid-cols-2">
      {ddayEvents.length > 0 && (
        <section aria-label="D-day 일정" className="rounded-2xl border border-border bg-card p-4">
          <header className="mb-3 flex items-center gap-2">
            <Flag className="size-4 text-primary" />
            <h2 className="font-bold text-foreground">D-day</h2>
          </header>
          <ul className="flex flex-col gap-2">
            {ddayEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-3 rounded-xl bg-primary/8 p-3">
                <span className="min-w-16 shrink-0 text-center text-sm font-bold text-primary">
                  {getDdayLabel(event, todayKey)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateRange(event.date, event.endDate)}</p>
                </div>
                {canManage && onEdit && (
                  <Button variant="ghost" size="icon" aria-label="D-day 일정 수정" onClick={() => onEdit(event)}>
                    <Pencil className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {pinnedEvents.length > 0 && (
        <section aria-label="중요 공지" className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <header className="mb-3 flex items-center gap-2">
            <Pin className="size-4 text-primary" />
            <h2 className="font-bold text-foreground">중요 공지</h2>
          </header>
          <ul className="flex flex-col gap-2">
            {pinnedEvents.map((event) => (
              <li key={event.id} className="flex items-start gap-3 rounded-xl border border-primary/15 bg-background p-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <CategoryBadge category={event.category} />
                    <span className="text-xs text-muted-foreground">{formatDateRange(event.date, event.endDate)}</span>
                  </div>
                  <p className="font-medium text-foreground">{event.title}</p>
                  {event.description && <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>}
                </div>
                {canManage && onEdit && (
                  <Button variant="ghost" size="icon" aria-label="중요 공지 수정" onClick={() => onEdit(event)}>
                    <Pencil className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
