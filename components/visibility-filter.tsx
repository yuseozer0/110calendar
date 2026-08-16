'use client'

import { Lock, Users } from 'lucide-react'
import type { EventVisibility } from '@/lib/types'
import { cn } from '@/lib/utils'

export type VisibilityFilterValue = 'all' | EventVisibility

const OPTIONS: Array<{
  value: VisibilityFilterValue
  label: string
  icon?: typeof Lock
}> = [
  { value: 'all', label: '전체' },
  { value: 'class', label: '학급', icon: Users },
  { value: 'private', label: '개인', icon: Lock },
]

export function VisibilityFilter({
  value,
  onChange,
}: {
  value: VisibilityFilterValue
  onChange: (value: VisibilityFilterValue) => void
}) {
  return (
    <div className="flex w-full rounded-xl bg-muted p-1" aria-label="일정 공개 범위 필터">
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
