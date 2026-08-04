'use client'

import { Clock, Flag, Pencil, Pin, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/components/category-badge'
import type { ClassEvent } from '@/lib/types'
import { formatDateRange } from '@/lib/date-utils'

interface EventListProps {
  title: string
  subtitle?: string
  events: ClassEvent[]
  emptyMessage: string
  showDate?: boolean
  canManage?: boolean
  onAdd?: () => void
  onEdit?: (event: ClassEvent) => void
  onDelete?: (id: string) => void
}

export function EventList({
  title,
  subtitle,
  events,
  emptyMessage,
  showDate = false,
  canManage = false,
  onAdd,
  onEdit,
  onDelete,
}: EventListProps) {
  return (
    <section aria-label={title} className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {canManage && onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="size-3.5" />
            일정 추가
          </Button>
        )}
      </header>

      {events.length === 0 ? (
        <p className="rounded-xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <CategoryBadge category={event.category} />
                  {showDate && <span className="text-xs font-medium text-muted-foreground">{formatDateRange(event.date, event.endDate)}</span>}
                  {event.isDday && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Flag className="size-3" />
                      D-day
                    </span>
                  )}
                  {event.isPinned && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Pin className="size-3" />
                      중요
                    </span>
                  )}
                  {event.time && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {event.time}
                    </span>
                  )}
                </div>
                <p className="font-medium text-foreground text-pretty">{event.title}</p>
                {event.description && <p className="mt-0.5 text-sm text-muted-foreground text-pretty">{event.description}</p>}
                {event.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt={`${event.title} 첨부 사진`}
                    className="mt-3 max-h-72 w-full rounded-xl border border-border object-contain"
                  />
                )}
              </div>
              {canManage && onEdit && onDelete && (
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" aria-label="일정 수정" onClick={() => onEdit(event)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    aria-label="일정 삭제"
                    onClick={() => {
                      if (window.confirm('이 일정을 삭제할까요?')) onDelete(event.id)
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
'use client'

import { Clock, Flag, Pencil, Pin, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/components/category-badge'
import type { ClassEvent } from '@/lib/types'
import { formatDateRange } from '@/lib/date-utils'

interface EventListProps {
  title: string
  subtitle?: string
  events: ClassEvent[]
  emptyMessage: string
  showDate?: boolean
  canManage?: boolean
  onAdd?: () => void
  onEdit?: (event: ClassEvent) => void
  onDelete?: (id: string) => void
}

export function EventList({
  title,
  subtitle,
  events,
  emptyMessage,
  showDate = false,
  canManage = false,
  onAdd,
  onEdit,
  onDelete,
}: EventListProps) {
  return (
    <section aria-label={title} className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {canManage && onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="size-3.5" />
            일정 추가
          </Button>
        )}
      </header>

      {events.length === 0 ? (
        <p className="rounded-xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <CategoryBadge category={event.category} />
                  {showDate && <span className="text-xs font-medium text-muted-foreground">{formatDateRange(event.date, event.endDate)}</span>}
                  {event.isDday && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Flag className="size-3" />
                      D-day
                    </span>
                  )}
                  {event.isPinned && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Pin className="size-3" />
                      중요
                    </span>
                  )}
                  {event.time && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {event.time}
                    </span>
                  )}
                </div>
                <p className="font-medium text-foreground text-pretty">{event.title}</p>
                {event.description && <p className="mt-0.5 text-sm text-muted-foreground text-pretty">{event.description}</p>}
              </div>
              {canManage && onEdit && onDelete && (
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" aria-label="일정 수정" onClick={() => onEdit(event)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    aria-label="일정 삭제"
                    onClick={() => {
                      if (window.confirm('이 일정을 삭제할까요?')) onDelete(event.id)
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
