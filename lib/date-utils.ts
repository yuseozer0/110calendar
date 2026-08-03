export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}

export function formatMonthTitle(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

export function formatFullDate(key: string): string {
  const date = parseDateKey(key)
  const weekday = WEEKDAY_LABELS[date.getDay()]
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`
}

export function getEventEndDate(event: { date: string; endDate?: string }): string {
  return event.endDate && event.endDate >= event.date ? event.endDate : event.date
}

export function formatDateRange(startKey: string, endKey?: string): string {
  const normalizedEnd = endKey && endKey >= startKey ? endKey : startKey
  if (normalizedEnd === startKey) return formatFullDate(startKey)
  return `${formatFullDate(startKey)} ~ ${formatFullDate(normalizedEnd)}`
}

export function dateKeyInRange(
  key: string,
  event: { date: string; endDate?: string },
): boolean {
  return key >= event.date && key <= getEventEndDate(event)
}

export function getDateRangeKeys(startKey: string, endKey?: string): string[] {
  const normalizedEnd = endKey && endKey >= startKey ? endKey : startKey
  const cursor = parseDateKey(startKey)
  const end = parseDateKey(normalizedEnd)
  const keys: string[] = []

  while (cursor <= end) {
    keys.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

export function daysBetween(fromKey: string, toKey: string): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return Math.round((parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / millisecondsPerDay)
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

/**
 * Returns a 6-week (42 day) grid starting from the Sunday on/before the first
 * day of the month, so the calendar always renders a stable rectangle.
 */
export function getCalendarGrid(monthDate: Date): Date[] {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const start = new Date(firstOfMonth)
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay())

  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(day)
  }
  return days
}
