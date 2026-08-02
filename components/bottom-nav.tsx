'use client'

import { CalendarDays, ListChecks, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MobileView = 'calendar' | 'list'

interface BottomNavProps {
  view: MobileView
  onViewChange: (view: MobileView) => void
  canManage: boolean
  onAdd: () => void
}

export function BottomNav({ view, onViewChange, canManage, onAdd }: BottomNavProps) {
  return (
    <nav aria-label="하단 내비게이션" className="sticky bottom-0 z-40 flex items-center justify-around border-t border-border bg-card/95 px-2 pt-2 pb-safe backdrop-blur md:hidden">
      <NavButton active={view === 'calendar'} label="캘린더" onClick={() => onViewChange('calendar')}>
        <CalendarDays className="size-5" />
      </NavButton>

      {canManage && (
        <button
          type="button"
          onClick={onAdd}
          aria-label="일정 추가"
          className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
        >
          <Plus className="size-6" />
        </button>
      )}

      <NavButton active={view === 'list'} label="검색" onClick={() => onViewChange('list')}>
        <ListChecks className="size-5" />
      </NavButton>
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
