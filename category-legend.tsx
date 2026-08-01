import { CATEGORIES } from '@/lib/categories'

export function CategoryLegend() {
  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        카테고리
      </h2>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {CATEGORIES.map((category) => (
          <li key={category.id} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-foreground">{category.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
