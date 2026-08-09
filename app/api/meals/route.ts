import { NextResponse } from 'next/server'
import { formatMealText, parseNutrition, type MealInfo } from '@/lib/meal'

export const runtime = 'nodejs'

function isDateKey(value: string) {
  return /^\d{8}$/.test(value)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')?.replaceAll('-', '') ?? ''
  if (!isDateKey(date)) return NextResponse.json({ error: '조회 날짜가 올바르지 않습니다.' }, { status: 400 })

  const apiKey = process.env.NEIS_API_KEY
  const educationCode = process.env.NEIS_ATPT_OFCDC_SC_CODE ?? 'B10'
  const schoolCode = process.env.NEIS_SD_SCHUL_CODE
  if (!apiKey || !schoolCode) {
    return NextResponse.json({ error: '급식 API 환경변수가 아직 설정되지 않았습니다.' }, { status: 503 })
  }

  const endpoint = new URL('https://open.neis.go.kr/hub/mealServiceDietInfo')
  endpoint.searchParams.set('KEY', apiKey)
  endpoint.searchParams.set('Type', 'json')
  endpoint.searchParams.set('pIndex', '1')
  endpoint.searchParams.set('pSize', '10')
  endpoint.searchParams.set('ATPT_OFCDC_SC_CODE', educationCode)
  endpoint.searchParams.set('SD_SCHUL_CODE', schoolCode)
  endpoint.searchParams.set('MLSV_YMD', date)

  try {
    const response = await fetch(endpoint, { next: { revalidate: date < new Date().toISOString().slice(0, 10).replaceAll('-', '') ? 21600 : 900 } })
    if (!response.ok) return NextResponse.json({ error: '급식 정보를 가져오지 못했습니다.' }, { status: 502 })
    const payload = (await response.json()) as { mealServiceDietInfo?: [{ row?: Array<Record<string, string>> }, { row?: Array<Record<string, string>> }] }
    const row = payload.mealServiceDietInfo?.find((section) => section.row?.length)?.row?.[0]
    if (!row) return NextResponse.json({ meal: null satisfies MealInfo | null }, { headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=3600' } })
    const names = formatMealText(row.DDISH_NM ?? '')
    const meal: MealInfo = {
      date: row.MLSV_YMD ?? date,
      schoolName: row.SCHUL_NM,
      items: names.map((name) => ({ name, allergies: (row.DDISH_NM?.match(/\(([0-9.\-]+)\)/)?.[1] ?? '').split('.').filter(Boolean) })),
      calories: row.CAL_INFO,
      nutrition: parseNutrition(row.NTR_INFO),
      origin: row.ORPLC_INFO,
    }
    return NextResponse.json({ meal }, { headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=3600' } })
  } catch {
    return NextResponse.json({ error: '급식 서버에 연결할 수 없습니다.' }, { status: 502 })
  }
}
