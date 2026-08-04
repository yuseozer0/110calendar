'use client'

import { useMemo, useState } from 'react'
import { useEvents } from '@/hooks/use-events'
import type { ClassEvent, EventDraft } from '@/lib/types'
import type { CategoryId } from '@/lib/categories'
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

function sortEvents(list: ClassEvent[]): ClassEvent[] {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    const at = a.time ?? '99:99'
    const bt = b.time ?? '99:99'
    return at < bt ? -1 : at > bt ? 1 : 0
  })
}

export default function Page() {
  const { events, loaded, error, addEvent, updateEvent, deleteEvent } = useEvents()
  const { isAdmin, authLoading, ready } = useFirebase()

  const todayKey = toDateKey(new Date())
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedKey, setSelectedKey] = useState(todayKey)
  const [activeCategories, setActiveCategories] = useState<CategoryId[]>([])
  const [query, setQuery] = useState('')
  const [mobileView, setMobileView] = useState<MobileView>('calendar')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ClassEvent | null>(null)

  const categoryFiltered = useMemo(() => {
    if (activeCategories.length === 0) return events
    return events.filter((e) => activeCategories.includes(e.category))
  }, [events, activeCategories])

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
      [...events]
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
    [events, todayKey],
  )

  const pinnedEvents = useMemo(
    () => sortEvents(events.filter((event) => event.isPinned)).slice(0, 3),
    [events],
  )

  const hasQuery = query.trim().length > 0

  const toggleCategory = (id: CategoryId) =>
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  const resetCategories = () => setActiveCategories([])

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (event: ClassEvent) => {
    setEditing(event)
    setDialogOpen(true)
  }
  const handleSave = async (draft: EventDraft) => {
    if (!isAdmin) throw new Error('관리자만 일정을 저장할 수 있습니다.')
    if (editing) {
      await updateEvent(editing.id, draft)
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
      canManage={isAdmin}
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
      canManage={isAdmin}
      onEdit={openEdit}
      onDelete={deleteEvent}
    />
  )

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[18rem_1fr]">
      <AppSidebar
        query={query}
        onQueryChange={setQuery}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        onResetCategories={resetCategories}
        canManage={isAdmin}
        onAdd={openAdd}
      />

      <div className="flex min-h-screen flex-col">
        {/* Header for phone + iPad portrait */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 pt-safe backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <BrandHeader compact />
            <div className="flex items-center gap-1">
              <PwaActions compact />
              <AdminAuthButton compact />
            </div>
          </div>
        </header>

        {/* iPad portrait search + filter bar */}
        <div className="hidden gap-3 border-b border-border px-4 py-3 md:flex md:flex-col lg:hidden">
          <SearchBar id="tablet-search" value={query} onChange={setQuery} />
          <CategoryFilter
            active={activeCategories}
            onToggle={toggleCategory}
            onReset={resetCategories}
          />
        </div>

        <main className="flex-1 px-4 py-4">
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
                canManage={isAdmin}
                onEdit={openEdit}
              />

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
          canManage={isAdmin}
          onAdd={openAdd}
        />
      </div>

      <EventDialog
        open={dialogOpen}
        defaultDate={selectedKey}
        editing={editing}
        onClose={() => {
          setDialogOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />
    </div>
  )
}
