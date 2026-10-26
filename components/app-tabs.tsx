'use client'

import { CalendarDays, ListChecks, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AppView = 'calendar' | 'events' | 'meals'

const TABS = [
  { id: 'calendar' as const, label: '캘린더', icon: CalendarDays },
  { id: 'events' as const, label: '전체 일정', icon: ListChecks },
  { id: 'meals' as const, label: '급식', icon: Utensils },
]

export function AppTabs({ view, onViewChange, className }: { view: AppView; onViewChange: (view: AppView) => void; className?: string }) {
  return (
    <nav aria-label="주요 메뉴" className={cn('flex items-center rounded-xl bg-muted/80 p-1', className)}>
      {TABS.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" onClick={() => onViewChange(id)} aria-current={view === id ? 'page' : undefined} className={cn('inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all', view === id ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground')}>
          <Icon className="size-4" />{label}
        </button>
      ))}
    </nav>
  )
}
