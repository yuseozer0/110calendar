'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandHeader } from '@/components/brand-header'
import { SearchBar } from '@/components/search-bar'
import { CategoryFilter } from '@/components/category-filter'
import { CategoryLegend } from '@/components/category-legend'
import { AdminAuthButton } from '@/components/admin-auth'
import { PwaActions } from '@/components/pwa-actions'
import { VisibilityFilter, type VisibilityFilterValue } from '@/components/visibility-filter'
import type { CategoryId } from '@/lib/categories'

interface AppSidebarProps {
  query: string
  onQueryChange: (value: string) => void
  activeCategories: CategoryId[]
  onToggleCategory: (id: CategoryId) => void
  onResetCategories: () => void
  loggedIn: boolean
  visibilityFilter: VisibilityFilterValue
  onVisibilityChange: (value: VisibilityFilterValue) => void
  canAdd: boolean
  onAdd: () => void
}

export function AppSidebar({
  query,
  onQueryChange,
  activeCategories,
  onToggleCategory,
  onResetCategories,
  loggedIn,
  visibilityFilter,
  onVisibilityChange,
  canAdd,
  onAdd,
}: AppSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen flex-col gap-6 overflow-y-auto border-r border-border bg-sidebar p-5 text-sidebar-foreground lg:flex">
      <BrandHeader />

      {canAdd && (
        <Button onClick={onAdd} className="w-full justify-center">
          <Plus className="size-4" />
          일정 추가
        </Button>
      )}

      <SearchBar id="sidebar-search" value={query} onChange={onQueryChange} />

      {loggedIn && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">일정 구분</h2>
          <VisibilityFilter value={visibilityFilter} onChange={onVisibilityChange} />
        </div>
      )}

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">카테고리 필터</h2>
        <CategoryFilter active={activeCategories} onToggle={onToggleCategory} onReset={onResetCategories} />
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <CategoryLegend />
        <PwaActions />
        <AdminAuthButton />
      </div>
    </aside>
  )
}
