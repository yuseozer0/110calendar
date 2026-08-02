import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrandHeaderProps {
  className?: string
  compact?: boolean
}

export function BrandHeader({ className, compact = false }: BrandHeaderProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <CalendarDays className="size-5" />
      </span>
      <div className="min-w-0">
        <h1
          className={cn(
            'font-bold leading-tight text-foreground',
            compact ? 'text-lg' : 'text-xl',
          )}
        >
          110 캘린더
        </h1>
        <p className="truncate text-xs text-muted-foreground">
          서문여자고등학교 1학년 10반
        </p>
      </div>
    </div>
  )
}
