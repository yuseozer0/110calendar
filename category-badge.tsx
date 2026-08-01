import { getCategory, type CategoryId } from '@/lib/categories'
import { cn } from '@/lib/utils'

interface CategoryBadgeProps {
  category: CategoryId
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const { label, color, softBg } = getCategory(category)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      style={{ backgroundColor: softBg, color }}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
