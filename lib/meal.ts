export type MealCategoryId = 'dessert' | 'meat' | 'spicy' | 'fusion' | 'fried' | 'noodle' | 'popular'

export interface MealItem {
  name: string
  allergies: string[]
}

export interface MealInfo {
  date: string
  schoolName?: string
  items: MealItem[]
  calories?: string
  nutrition?: Record<string, string>
  origin?: string
}

export const MEAL_CATEGORIES: Record<MealCategoryId, { label: string; emoji: string; score: number; keywords: string[] }> = {
  dessert: { label: '디저트', emoji: '🍰', score: 3, keywords: ['케이크', '쿠키', '마카롱', '푸딩', '아이스크림', '젤리', '요거트', '와플', '빵', '초콜릿', '브라우니', '핫케이크', '과일', '떡'] },
  meat: { label: '고기', emoji: '🍖', score: 3, keywords: ['제육', '돈까스', '돈가스', '치킨', '닭갈비', '불고기', '갈비', '스테이크', '삼겹살', '떡갈비', '함박', '소시지', '돼지', '소고기', '닭'] },
  spicy: { label: '매콤', emoji: '🌶️', score: 2, keywords: ['떡볶이', '닭갈비', '제육', '김치찌개', '마라', '매운', '불닭', '고추장', '비빔', '쭈꾸미'] },
  fusion: { label: '양식·퓨전', emoji: '🍝', score: 2, keywords: ['파스타', '스파게티', '피자', '리조또', '오므라이스', '로제', '크림', '함박', '치즈', '타코'] },
  fried: { label: '치킨·튀김', emoji: '🍗', score: 3, keywords: ['치킨', '닭강정', '돈까스', '돈가스', '탕수육', '튀김', '핫도그', '고로케', '너겟'] },
  noodle: { label: '면·분식', emoji: '🍜', score: 2, keywords: ['라면', '우동', '소바', '국수', '쫄면', '떡볶이', '만두'] },
  popular: { label: '인기 메뉴', emoji: '✨', score: 1, keywords: ['덮밥', '볶음밥', '김밥', '카레', '햄버거'] },
}

export function getMealHighlights(items: MealItem[]) {
  return items
    .map((item) => {
      const normalized = item.name.replace(/\s/g, '').toLowerCase()
      const categories = (Object.entries(MEAL_CATEGORIES) as [MealCategoryId, (typeof MEAL_CATEGORIES)[MealCategoryId]][])
        .filter(([, category]) => category.keywords.some((keyword) => normalized.includes(keyword.replace(/\s/g, '').toLowerCase())))
        .map(([id]) => id)
      return { ...item, categories, score: categories.reduce((sum, id) => sum + MEAL_CATEGORIES[id].score, 0) }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ko'))
    .slice(0, 3)
}

export function formatMealText(value: string) {
  return value
    .split(/<br\s*\/?\s*>|\n/i)
    .map((line) => line.replace(/\s*\([0-9.\-]+\)\s*$/, '').trim())
    .filter(Boolean)
}

export function parseMealItems(value: string): MealItem[] {
  return value
    .split(/<br\s*\/?\s*>|\n/i)
    .map((raw) => {
      const allergies = raw.match(/\(([0-9.\-]+)\)/)?.[1]?.split('.').filter(Boolean) ?? []
      return { name: raw.replace(/\s*\([0-9.\-]+\)\s*$/, '').trim(), allergies }
    })
    .filter((item) => item.name)
}

export function parseNutrition(value?: string) {
  if (!value) return undefined
  const result: Record<string, string> = {}
  value.split('<br/>').forEach((part) => {
    const [label, amount] = part.split(':').map((item) => item.trim())
    if (label && amount) result[label] = amount
  })
  return Object.keys(result).length ? result : undefined
}
