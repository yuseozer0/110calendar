'use client'

import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Utensils } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BrandHeader } from '@/components/brand-header'
import { formatFullDate, toDateKey } from '@/lib/date-utils'
import { getMealHighlights, MEAL_CATEGORIES, type MealInfo } from '@/lib/meal'

export default function MealsPage() {
  const [date, setDate] = useState(toDateKey(new Date()))
  const [meal, setMeal] = useState<MealInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    fetch(`/api/meals?date=${date}`).then(async (response) => {
      const data = (await response.json()) as { meal?: MealInfo | null; error?: string }
      if (!response.ok) throw new Error(data.error ?? '급식 정보를 불러오지 못했어요.')
      if (!cancelled) setMeal(data.meal ?? null)
    }).catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : '급식 정보를 불러오지 못했어요.') }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [date])
  const picks = useMemo(() => meal ? getMealHighlights(meal.items) : [], [meal])
  const shiftDate = (amount: number) => { const next = new Date(`${date}T12:00:00`); next.setDate(next.getDate() + amount); setDate(toDateKey(next)) }
  return <main className="min-h-screen bg-background px-4 py-4 sm:px-6"><div className="mx-auto max-w-2xl space-y-4"><div className="flex items-center justify-between"><Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-primary"><ArrowLeft className="size-4" />캘린더</Link><BrandHeader compact /></div><section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="mb-5 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Utensils className="size-6" /></span><div><h1 className="text-xl font-bold">급식</h1><p className="text-sm text-muted-foreground">오늘 뭐 먹지?</p></div></div><div className="mb-5 flex items-center justify-between gap-2 rounded-xl bg-muted/60 p-2"><button type="button" aria-label="이전 날짜" onClick={() => shiftDate(-1)} className="flex size-11 items-center justify-center rounded-lg hover:bg-card"><ChevronLeft className="size-5" /></button><label className="flex flex-col items-center gap-1"><span className="text-sm font-semibold">{formatFullDate(date)}</span><input aria-label="급식 날짜 선택" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-md border border-border bg-card px-2 py-1 text-xs" /></label><button type="button" aria-label="다음 날짜" onClick={() => shiftDate(1)} className="flex size-11 items-center justify-center rounded-lg hover:bg-card"><ChevronRight className="size-5" /></button></div>{loading ? <div className="space-y-3 animate-pulse"><div className="h-5 w-32 rounded bg-muted" /><div className="h-5 w-full rounded bg-muted" /><div className="h-5 w-4/5 rounded bg-muted" /></div> : error ? <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">{error}</p> : !meal ? <div className="rounded-xl bg-muted p-5 text-center text-sm text-muted-foreground">이 날은 급식이 없습니다.</div> : <><h2 className="mb-2 text-sm font-bold tracking-wide text-primary">✨ TODAY'S PICK</h2>{picks.length > 0 && <div className="mb-5 flex flex-wrap gap-2">{picks.map((pick) => <span key={pick.name} className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">{pick.categories.slice(0, 1).map((id) => MEAL_CATEGORIES[id].emoji)} {pick.name}</span>)}</div>}<h2 className="mb-2 text-sm font-semibold">전체 메뉴</h2><ul className="space-y-2">{meal.items.map((item, index) => <li key={`${item.name}-${index}`} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{item.name}</li>)}</ul>{(meal.calories || meal.nutrition) && <div className="mt-5 rounded-xl border border-border p-3 text-xs text-muted-foreground">{meal.calories && <p>열량 {meal.calories}</p>}{meal.nutrition && <p className="mt-1">{Object.entries(meal.nutrition).join(' · ')}</p>}</div>}</>}</section></div></main>
}
