import { getCategory, type CategoryId } from '@/lib/categories'
import { cn } from '@/lib/utils'

interface CategoryBadgeProps {
  category: CategoryId
  label?: string
  color?: string
  className?: string
}

export function CategoryBadge({ category, label: customLabel, color: customColor, className }: CategoryBadgeProps) {
  const { label, color, softBg } = getCategory(category, customLabel, customColor)
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
