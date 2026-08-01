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
      className="flex flex-col rounded-2xl border border-border bg-card p-3 sm:p-4"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-foreground sm:text-xl">
          {formatMonthTitle(monthDate)}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onToday}>
            오늘
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="이전 달"
            onClick={onPrevMonth}
          >
            <ChevronLeft className="size-4" />
          </Button>
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

      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={cn(
              'pb-2 text-center text-xs font-semibold',
              index === 0 && 'text-destructive',
              index === 6 && 'text-chart-5',
              index !== 0 && index !== 6 && 'text-muted-foreground',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 gap-1">
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
                'flex min-h-14 flex-col items-center gap-1 rounded-lg p-1 text-sm transition-colors sm:min-h-20 sm:p-2',
                inMonth ? 'text-foreground' : 'text-muted-foreground/40',
                isSelected
                  ? 'bg-primary/10 ring-2 ring-primary'
                  : 'hover:bg-muted',
              )}
            >
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-xs font-medium sm:text-sm',
                  isToday && 'bg-primary text-primary-foreground',
                  !isToday && inMonth && weekday === 0 && 'text-destructive',
                  !isToday && inMonth && weekday === 6 && 'text-chart-5',
                )}
              >
                {day.getDate()}
              </span>
              <span className="flex flex-wrap items-center justify-center gap-0.5">
                {dayEvents.slice(0, 4).map((event) => (
                  <span
                    key={event.id}
                    aria-hidden="true"
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: getCategory(event.category).color }}
                  />
                ))}
                {dayEvents.length > 4 && (
                  <span className="text-[10px] leading-none text-muted-foreground">
                    +{dayEvents.length - 4}
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
