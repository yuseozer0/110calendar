'use client'

import { CATEGORIES, type CategoryId } from '@/lib/categories'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  active: CategoryId[]
  onToggle: (id: CategoryId) => void
  onReset: () => void
}

export function CategoryFilter({ active, onToggle, onReset }: CategoryFilterProps) {
  const allActive = active.length === 0

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onReset}
        aria-pressed={allActive}
        className={cn(
          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
          allActive
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card text-muted-foreground hover:bg-muted',
        )}
      >
        전체
      </button>
      {CATEGORIES.map((category) => {
        const isActive = active.includes(category.id)
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onToggle(category.id)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'border-transparent'
                : 'border-border bg-card text-muted-foreground hover:bg-muted',
            )}
            style={
              isActive
                ? { backgroundColor: category.softBg, color: category.color }
                : undefined
            }
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.label}
          </button>
        )
      })}
    </div>
  )
}
