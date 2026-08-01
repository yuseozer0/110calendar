'use client'

import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  id?: string
}

export function SearchBar({ value, onChange, id }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="일정 제목·메모 검색"
        aria-label="일정 검색"
        className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {value && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
