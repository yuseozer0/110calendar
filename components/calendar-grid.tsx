'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCategory } from '@/lib/categories'
import type { ClassEvent } from '@/lib/types'
import {
  WEEKDAY_LABELS,
  formatMonthTitle,
  getCalendarGrid,
  isSameDay,
  toDateKey,
} from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface CalendarGridProps {
  monthDate: Date
  selectedKey: string
  eventsByDay: Map<string, ClassEvent[]>
  onSelectDay: (key: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export function CalendarGrid({
  monthDate,
  selectedKey,
  eventsByDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarGridProps) {
  const today = new Date()
  const days = getCalendarGrid(monthDate)
  const currentMonth = monthDate.getMonth()

  return (
    <section
      aria-label="월간 캘린더"
      className="theme-surface-shadow flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-4 sm:px-5 sm:py-5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {formatMonthTitle(monthDate)}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="이전 달"
            onClick={onPrevMonth}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>오늘</Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="다음 달"
            onClick={onNextMonth}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-border px-1 pt-3 sm:px-2">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={cn(
              'pb-3 text-center text-[11px] font-semibold sm:text-base',
              index === 0 || index === 6 ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 gap-px bg-border/70">
        {days.map((day) => {
          const key = toDateKey(day)
          const dayEvents = eventsByDay.get(key) ?? []
          const inMonth = day.getMonth() === currentMonth
          const isToday = isSameDay(day, today)
          const isSelected = key === selectedKey
          const weekday = day.getDay()

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(key)}
              aria-pressed={isSelected}
              aria-label={`${day.getMonth() + 1}월 ${day.getDate()}일, 일정 ${dayEvents.length}개`}
              className={cn(
                'group flex min-h-[var(--calendar-cell-mobile)] min-w-0 flex-col items-stretch gap-1 bg-card p-1 text-sm transition-colors sm:min-h-[var(--calendar-cell-height)] sm:p-2',
                inMonth ? 'text-foreground' : 'bg-muted/25 text-muted-foreground/40',
                isSelected
                  ? 'relative z-10 bg-primary/6 ring-2 ring-inset ring-primary/70'
                  : 'hover:bg-muted/60',
              )}
            >
              <span
                className={cn(
                  'ml-auto flex min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-semibold sm:min-w-8 sm:text-lg',
                  isToday && 'bg-destructive text-white',
                  !isToday && inMonth && weekday === 0 && 'text-destructive',
                  !isToday && inMonth && weekday === 6 && 'text-chart-5',
                )}
              >
                {day.getDate()}{day.getDate() === 1 && <span className="hidden sm:inline">일</span>}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((event, index) => (
                  <span
                    key={`${event.visibility}:${event.id}`}
                    className={cn('min-w-0 items-center gap-1 overflow-hidden rounded px-1 py-0.5 text-left text-[9px] font-semibold leading-tight text-white sm:text-xs', index === 2 ? 'hidden sm:flex' : 'flex')}
                    style={{ backgroundColor: getCategory(event.category, event.categoryLabel, event.categoryColor).color }}
                  >
                    <span className="size-1.5 shrink-0 rounded-full border border-white/90" />
                    <span className="truncate">{event.title}</span>
                  </span>
                ))}
                {dayEvents.length > 3 && (
                  <span className="px-1 text-left text-[9px] leading-none text-muted-foreground sm:text-[10px]">
                    +{dayEvents.length - 3}개
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
