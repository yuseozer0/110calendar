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
import { AppSidebar } from '@/components/app-sidebar'
import { CalendarGrid } from '@/components/calendar-grid'
import { CategoryFilter } from '@/components/category-filter'
import { SearchBar } from '@/components/search-bar'
import { EventList } from '@/components/event-list'
import { BottomNav, type MobileView } from '@/components/bottom-nav'
import { EventDialog } from '@/components/event-dialog'
import { EventHighlights } from '@/components/event-highlights'
import { AdminAuthButton } from '@/components/admin-auth'
import { PwaActions } from '@/components/pwa-actions'
import { useFirebase } from '@/components/firebase-provider'
import { MealCard } from '@/components/meal-card'
import { VisibilityFilter, type VisibilityFilterValue } from '@/components/visibility-filter'

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
  const [mobileView, setMobileView] = useState<MobileView>('calendar')

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
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[18rem_1fr]">
      <AppSidebar
        query={query}
        onQueryChange={setQuery}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        onResetCategories={resetCategories}
        filterCategories={filterCategories}
        personalCategories={personalCategories}
        canManagePersonalCategories={visibilityFilter === 'private'}
        onAddCategory={addCategory}
        onRenameCategory={renameCategory}
        onDeleteCategory={deleteCategory}
        loggedIn={Boolean(user)}
        visibilityFilter={visibilityFilter}
        onVisibilityChange={setVisibilityFilter}
        canAdd={Boolean(user)}
        onAdd={openAdd}
      />

      <div className="flex min-h-dvh flex-col">
        {/* Header for phone + iPad portrait */}
        <header className="mobile-header-safe sticky top-0 z-30 border-b border-border bg-background/95 px-4 pb-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <BrandHeader compact />
            <div className="flex items-center gap-1">
              <PwaActions compact />
              <div className="hidden md:block">
                <AdminAuthButton compact />
              </div>
            </div>
          </div>
          <div className="mt-2 [&>button]:w-full md:hidden">
            <AdminAuthButton />
          </div>
        </header>

        {/* iPad portrait search + filter bar */}
        <div className="hidden gap-3 border-b border-border px-4 py-3 md:flex md:flex-col lg:hidden">
          <SearchBar id="tablet-search" value={query} onChange={setQuery} />
          {user && <VisibilityFilter value={visibilityFilter} onChange={setVisibilityFilter} />}
          <CategoryFilter
            active={activeCategories}
            onToggle={toggleCategory}
            onReset={resetCategories}
            categories={filterCategories}
            personalCategories={personalCategories}
            canManagePersonal={visibilityFilter === 'private'}
            onAddCategory={addCategory}
            onRenameCategory={renameCategory}
            onDeleteCategory={deleteCategory}
          />
        </div>

        <main className="flex-1 px-4 py-4">
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
          {user && (
            <div className="mb-4 md:hidden">
              <VisibilityFilter value={visibilityFilter} onChange={setVisibilityFilter} />
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
              <EventHighlights
                ddayEvents={ddayEvents}
                pinnedEvents={pinnedEvents}
                todayKey={todayKey}
                canManageEvent={canManageEvent}
                onEdit={openEdit}
              />

              <div className="mb-4">
                <MealCard />
              </div>

              {/* Phone: single column, tab-driven */}
              <div className="flex flex-col gap-4 md:hidden">
                {mobileView === 'calendar' ? (
                  <>
                    {calendarBlock}
                    {selectedDayBlock}
                  </>
                ) : (
                  <>
                    <SearchBar
                      id="mobile-search"
                      value={query}
                      onChange={setQuery}
                    />
                    <CategoryFilter
                      active={activeCategories}
                      onToggle={toggleCategory}
                      onReset={resetCategories}
                      categories={filterCategories}
                      personalCategories={personalCategories}
                      canManagePersonal={visibilityFilter === 'private'}
                      onAddCategory={addCategory}
                      onRenameCategory={renameCategory}
                      onDeleteCategory={deleteCategory}
                    />
                    {resultsBlock}
                  </>
                )}
              </div>

              {/* iPad portrait: 2 columns / landscape: wide calendar + panel */}
              <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-[1.7fr_1fr]">
                <div className="flex flex-col gap-4">{calendarBlock}</div>
                <div className="flex flex-col gap-4">
                  {selectedDayBlock}
                  {resultsBlock}
                </div>
              </div>
            </>
          )}
        </main>

      <BottomNav
        view={mobileView}
        onViewChange={setMobileView}
        canAdd={Boolean(user)}
        onAdd={openAdd}
        />
      </div>

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
