'use client'

import { useEffect, useMemo, useState } from 'react'
import { useEvents } from '@/hooks/use-events'
import { usePersonalCategories } from '@/hooks/use-personal-categories'
import type { ClassEvent, EventDraft } from '@/lib/types'
import { CATEGORIES, type CategoryId } from '@/lib/categories'
import {
  addMonths,
  dateKeyInRange,
  daysBetween,
  formatFullDate,
  getDateRangeKeys,
  getEventEndDate,
  parseDateKey,
  toDateKey,
} from '@/lib/date-utils'
import { BrandHeader } from '@/components/brand-header'
import { CalendarGrid } from '@/components/calendar-grid'
import { CategoryFilter } from '@/components/category-filter'
import { SearchBar } from '@/components/search-bar'
import { EventList } from '@/components/event-list'
import { BottomNav } from '@/components/bottom-nav'
import { AppTabs, type AppView } from '@/components/app-tabs'
import { EventDialog } from '@/components/event-dialog'
import { EventHighlights } from '@/components/event-highlights'
import { AdminAuthButton } from '@/components/admin-auth'
import { PwaActions } from '@/components/pwa-actions'
import { useFirebase } from '@/components/firebase-provider'
import { MealCard } from '@/components/meal-card'
import { VisibilityFilter, type VisibilityFilterValue } from '@/components/visibility-filter'
import { ThemeSettings } from '@/components/theme-settings'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

function sortEvents(list: ClassEvent[]): ClassEvent[] {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    const at = a.time ?? '99:99'
    const bt = b.time ?? '99:99'
    return at < bt ? -1 : at > bt ? 1 : 0
  })
}

export default function Page() {
  const {
    events,
    loaded,
    error,
    notificationStatus,
    clearNotificationStatus,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useEvents()
  const {
    categories: personalCategories,
    addCategory,
    renameCategory,
    deleteCategory,
  } = usePersonalCategories()
  const { user, isAdmin, authLoading, ready } = useFirebase()

  const todayKey = toDateKey(new Date())
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedKey, setSelectedKey] = useState(todayKey)
  const [activeCategories, setActiveCategories] = useState<CategoryId[]>([])
  const [query, setQuery] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilterValue>('all')
  const [view, setView] = useState<AppView>('calendar')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ClassEvent | null>(null)

  useEffect(() => {
    if (!user) setVisibilityFilter('all')
  }, [user])

  useEffect(() => {
    setActiveCategories([])
  }, [visibilityFilter])

  const filterCategories = visibilityFilter === 'private'
    ? [...CATEGORIES, ...personalCategories]
    : CATEGORIES

  const visibilityFiltered = useMemo(() => {
    if (visibilityFilter === 'all') return events
    return events.filter((event) => event.visibility === visibilityFilter)
  }, [events, visibilityFilter])

  const categoryFiltered = useMemo(() => {
    if (activeCategories.length === 0) return visibilityFiltered
    return visibilityFiltered.filter((event) => activeCategories.includes(event.category))
  }, [visibilityFiltered, activeCategories])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ClassEvent[]>()
    for (const event of categoryFiltered) {
      for (const key of getDateRangeKeys(event.date, event.endDate)) {
        const list = map.get(key) ?? []
        list.push(event)
        map.set(key, list)
      }
    }
    for (const [key, list] of map) map.set(key, sortEvents(list))
    return map
  }, [categoryFiltered])

  const selectedDayEvents = useMemo(
    () => sortEvents(categoryFiltered.filter((e) => dateKeyInRange(selectedKey, e))),
    [categoryFiltered, selectedKey],
  )

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return sortEvents(categoryFiltered.filter((e) => getEventEndDate(e) >= todayKey))
    }
    return sortEvents(
      categoryFiltered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description?.toLowerCase().includes(q) ?? false),
      ),
    )
  }, [categoryFiltered, query, todayKey])

  const ddayEvents = useMemo(
    () =>
      [...visibilityFiltered]
        .filter((event) => event.isDday)
        .sort((a, b) => {
          const aDistance = todayKey < a.date
            ? daysBetween(todayKey, a.date)
            : todayKey <= getEventEndDate(a)
              ? 0
              : daysBetween(getEventEndDate(a), todayKey)
          const bDistance = todayKey < b.date
            ? daysBetween(todayKey, b.date)
            : todayKey <= getEventEndDate(b)
              ? 0
              : daysBetween(getEventEndDate(b), todayKey)
          return aDistance - bDistance
        })
        .slice(0, 3),
    [visibilityFiltered, todayKey],
  )

  const pinnedEvents = useMemo(
    () => sortEvents(visibilityFiltered.filter((event) => event.isPinned)).slice(0, 3),
    [visibilityFiltered],
  )

  const hasQuery = query.trim().length > 0

  const toggleCategory = (id: CategoryId) =>
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  const resetCategories = () => setActiveCategories([])

  const canManageEvent = (event: ClassEvent) =>
    event.visibility === 'class'
      ? isAdmin
      : Boolean(user && event.ownerId === user.uid)

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (event: ClassEvent) => {
    setEditing(event)
    setDialogOpen(true)
  }
  const handleSave = async (draft: EventDraft) => {
    if (editing) {
      await updateEvent(editing, draft)
    } else {
      await addEvent(draft)
      setSelectedKey(draft.date)
      setMonthDate(
        (() => {
          const d = parseDateKey(draft.date)
          return new Date(d.getFullYear(), d.getMonth(), 1)
        })(),
      )
    }
    setDialogOpen(false)
    setEditing(null)
  }

  const selectedDateLabel = formatFullDate(selectedKey)

  const calendarBlock = (
    <CalendarGrid
      monthDate={monthDate}
      selectedKey={selectedKey}
      eventsByDay={eventsByDay}
      onSelectDay={setSelectedKey}
      onPrevMonth={() => setMonthDate((d) => addMonths(d, -1))}
      onNextMonth={() => setMonthDate((d) => addMonths(d, 1))}
      onToday={() => {
        const now = new Date()
        setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1))
        setSelectedKey(toDateKey(now))
      }}
    />
  )

  const selectedDayBlock = (
    <EventList
      title="선택한 날짜"
      subtitle={selectedDateLabel}
      events={selectedDayEvents}
      emptyMessage="이 날에는 등록된 일정이 없어요."
      canAdd={Boolean(user)}
      canManageEvent={canManageEvent}
      onAdd={openAdd}
      onEdit={openEdit}
      onDelete={deleteEvent}
    />
  )

  const resultsBlock = (
    <EventList
      title={hasQuery ? '검색 결과' : '다가오는 일정'}
      subtitle={
        hasQuery
          ? `"${query.trim()}" 검색 결과 ${searchResults.length}건`
          : '오늘 이후의 일정'
      }
      events={searchResults}
      emptyMessage={
        hasQuery ? '검색 결과가 없어요.' : '다가오는 일정이 없어요.'
      }
      showDate
      canManageEvent={canManageEvent}
      onEdit={openEdit}
      onDelete={deleteEvent}
    />
  )

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mobile-header-safe sticky top-0 z-30 border-b border-border bg-card/88 pb-3 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[96rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <BrandHeader compact />
          <AppTabs view={view} onViewChange={setView} className="hidden md:flex" />
          <div className="flex items-center gap-1.5">
            {user && <Button onClick={openAdd} size="sm" className="hidden sm:inline-flex"><Plus className="size-4" />일정 추가</Button>}
            <ThemeSettings />
            <PwaActions compact />
            <AdminAuthButton compact />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[96rem] flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          {notificationStatus && (
            <div
              role="status"
              className={notificationStatus.kind === 'success'
                ? 'mb-4 flex items-center justify-between gap-3 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary'
                : 'mb-4 flex items-center justify-between gap-3 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200'}
            >
              <span>{notificationStatus.message}</span>
              <button type="button" className="shrink-0 font-medium underline" onClick={clearNotificationStatus}>닫기</button>
            </div>
          )}
          {!ready ? (
            <p className="rounded-xl bg-destructive/10 p-4 text-center text-sm text-destructive">
              Firebase 환경변수가 설정되지 않았습니다.
            </p>
          ) : error ? (
            <p className="rounded-xl bg-destructive/10 p-4 text-center text-sm text-destructive">{error}</p>
          ) : !loaded || authLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          ) : (
            <>
              {view === 'calendar' && (
                <div className="space-y-4 sm:space-y-6">
                  <EventHighlights ddayEvents={ddayEvents} pinnedEvents={pinnedEvents} todayKey={todayKey} canManageEvent={canManageEvent} onEdit={openEdit} />
                  {calendarBlock}
                  <div className="mx-auto max-w-4xl">{selectedDayBlock}</div>
                </div>
              )}
              {view === 'events' && (
                <div className="mx-auto max-w-5xl space-y-4">
                  <div className="theme-surface-shadow rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-4"><h2 className="text-xl font-bold tracking-tight">전체 일정</h2></div>
                    <div className="space-y-3">
                      <SearchBar id="event-search" value={query} onChange={setQuery} />
                      {user && <VisibilityFilter value={visibilityFilter} onChange={setVisibilityFilter} />}
                      <CategoryFilter active={activeCategories} onToggle={toggleCategory} onReset={resetCategories} categories={filterCategories} personalCategories={personalCategories} canManagePersonal={visibilityFilter === 'private'} onAddCategory={addCategory} onRenameCategory={renameCategory} onDeleteCategory={deleteCategory} />
                    </div>
                  </div>
                  {resultsBlock}
                </div>
              )}
              {view === 'meals' && <div className="mx-auto max-w-3xl"><MealCard /></div>}
            </>
          )}
      </main>

      <BottomNav view={view} onViewChange={setView} canAdd={Boolean(user)} onAdd={openAdd} />

      <EventDialog
        open={dialogOpen}
        defaultDate={selectedKey}
        editing={editing}
        canCreateClass={isAdmin}
        defaultVisibility={visibilityFilter === 'private' ? 'private' : isAdmin ? 'class' : 'private'}
        personalCategories={personalCategories}
        onClose={() => {
          setDialogOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />
    </div>
  )
}
