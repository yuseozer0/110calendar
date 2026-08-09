'use client'

import Link from 'next/link'
import { ChevronRight, Utensils } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { formatFullDate, toDateKey } from '@/lib/date-utils'
import { getMealHighlights, MEAL_CATEGORIES, type MealInfo } from '@/lib/meal'

function MealSkeleton() {
  return <div className="space-y-3 animate-pulse"><div className="h-4 w-28 rounded bg-muted" /><div className="h-4 w-full rounded bg-muted" /><div className="h-4 w-4/5 rounded bg-muted" /></div>
}

export function MealCard() {
  const [meal, setMeal] = useState<MealInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const today = toDateKey(new Date())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/meals?date=${today}`)
      .then(async (response) => {
        const data = (await response.json()) as { meal?: MealInfo | null; error?: string }
        if (!response.ok) throw new Error(data.error ?? '급식 정보를 불러오지 못했어요.')
        if (!cancelled) setMeal(data.meal ?? null)
      })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : '급식 정보를 불러오지 못했어요.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [today])

  const picks = useMemo(() => meal ? getMealHighlights(meal.items) : [], [meal])
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="today-meal-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Utensils className="size-5" /></span><div><h2 id="today-meal-title" className="font-semibold">오늘의 급식</h2><p className="text-xs text-muted-foreground">{formatFullDate(today)}</p></div></div>
        <Link href="/meals" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-primary hover:bg-primary/10">전체 급식 보기<ChevronRight className="size-4" /></Link>
      </div>
      {loading ? <MealSkeleton /> : error ? <p className="rounded-xl bg-muted px-3 py-4 text-sm text-muted-foreground">{error}</p> : !meal ? <p className="rounded-xl bg-muted px-3 py-4 text-sm text-muted-foreground">오늘은 급식이 없습니다.</p> : <>
        {picks.length > 0 && <div className="mb-4 rounded-xl bg-primary/5 p-3"><p className="mb-2 text-xs font-bold tracking-wide text-primary">✨ TODAY'S PICK</p><div className="flex flex-wrap gap-2">{picks.map((pick) => <span key={pick.name} className="rounded-lg bg-card px-2.5 py-1.5 text-sm font-medium shadow-sm">{pick.categories.slice(0, 1).map((id) => MEAL_CATEGORIES[id].emoji)} {pick.name}</span>)}</div></div>}
        <ul className="space-y-1.5 text-sm text-foreground">{meal.items.map((item, index) => <li key={`${item.name}-${index}`} className="flex gap-2"><span className="text-muted-foreground">•</span><span>{item.name}</span></li>)}</ul>
        {meal.calories && <p className="mt-4 text-xs text-muted-foreground">열량 {meal.calories}</p>}
      </>}
    </section>
  )
}
