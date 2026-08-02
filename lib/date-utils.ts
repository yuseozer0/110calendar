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
