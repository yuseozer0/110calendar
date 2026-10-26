'use client'

import { CalendarDays, ListChecks, Plus, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppView } from '@/components/app-tabs'

interface BottomNavProps {
  view: AppView
  onViewChange: (view: AppView) => void
  canAdd: boolean
  onAdd: () => void
}

export function BottomNav({ view, onViewChange, canAdd, onAdd }: BottomNavProps) {
  return (
    <nav aria-label="하단 내비게이션" className="sticky bottom-0 z-40 grid grid-cols-3 border-t border-border bg-card/92 px-2 pt-2 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl md:hidden">
      <NavButton active={view === 'calendar'} label="캘린더" onClick={() => onViewChange('calendar')}>
        <CalendarDays className="size-5" />
      </NavButton>

      <NavButton active={view === 'events'} label="전체 일정" onClick={() => onViewChange('events')}>
        <ListChecks className="size-5" />
      </NavButton>
      <NavButton active={view === 'meals'} label="급식" onClick={() => onViewChange('meals')}>
        <Utensils className="size-5" />
      </NavButton>

      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          aria-label="일정 추가"
          className="absolute -top-16 right-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95"
        >
          <Plus className="size-6" />
        </button>
      )}
    </nav>
  )
}

function NavButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-xs font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
      {label}
    </button>
  )
}
