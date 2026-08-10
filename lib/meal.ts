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
  dessert: {
    label: '디저트',
    emoji: '🍰',
    score: 7,
    keywords: [
      '케이크', '케익', '쿠키', '마카롱', '푸딩', '아이스크림', '아이스바',
      '샤베트', '젤리', '요거트', '요구르트', '와플', '크로플', '도넛',
      '츄러스', '타르트', '머핀', '마들렌', '휘낭시에', '브라우니', '핫케이크',
      '초콜릿', '초코', '티라미수', '마늘빵', '과일', '망고', '수박', '딸기',
      '복숭아', '포도', '파인애플', '에이드', '주스', '스무디',
    ],
  },
  meat: { label: '고기', emoji: '🍖', score: 6, keywords: ['제육', '돈까스', '돈가스', '치킨', '닭갈비', '불고기', '갈비', '스테이크', '삼겹살', '떡갈비', '함박', '소시지', '돼지', '소고기', '닭'] },
  spicy: { label: '매콤', emoji: '🌶️', score: 5, keywords: ['떡볶이', '닭갈비', '제육', '김치찌개', '마라', '매운', '불닭', '고추장', '비빔', '쭈꾸미'] },
  fusion: { label: '양식·퓨전', emoji: '🍝', score: 6, keywords: ['파스타', '스파게티', '피자', '리조또', '오므라이스', '로제', '크림', '함박', '치즈', '타코'] },
  fried: { label: '치킨·튀김', emoji: '🍗', score: 6, keywords: ['치킨', '닭강정', '돈까스', '돈가스', '탕수육', '튀김', '핫도그', '고로케', '너겟', '치즈볼', '회오리감자'] },
  noodle: { label: '면·분식', emoji: '🍜', score: 5, keywords: ['라면', '우동', '소바', '모밀', '국수', '쫄면', '떡볶이', '만두'] },
  popular: { label: '인기 메뉴', emoji: '✨', score: 5, keywords: ['덮밥', '볶음밥', '김밥', '초밥', '카레', '햄버거'] },
}

interface MealPreferenceRule {
  score: number
  keywords: string[]
}

/**
 * Preference calibration from the first Today's Pick survey.
 *
 * A specific menu-family score wins over its broader category score. This lets
 * desserts rank highly without making every item containing a broad word such
 * as "빵" or "과일" an automatic first choice.
 */
const MEAL_PREFERENCE_RULES: MealPreferenceRule[] = [
  {
    score: 10,
    keywords: ['케이크', '케익', '티라미수', '수박', '치킨텐더', '불고기', '삼겹살', '로제스파게티', '닭갈비볶음밥'],
  },
  {
    score: 9,
    keywords: [
      '아이스크림', '아이스망고', '마카롱', '요거트', '요구르트', '치즈볼',
      '마늘빵', '브라우니', '와플', '크로플', '도넛', '츄러스', '타르트',
      '마들렌', '휘낭시에', '푸딩', '치킨', '닭강정', '돈까스', '돈가스', '피자',
    ],
  },
  {
    score: 8.5,
    keywords: ['주스', '스무디'],
  },
  {
    score: 8,
    keywords: [
      '불닭', '떡볶이', '소시지', '유부초밥', '회오리감자', '에이드', '젤리', '핫케이크',
      '제육', '갈비', '스테이크', '햄버거', '탕수육', '핫도그', '라면', '만두',
    ],
  },
  {
    score: 7,
    keywords: [
      '참치마요덮밥', '냉모밀', '샤베트', '아이스바', '볶음밥', '덮밥',
      '우동', '국수', '파스타', '함박', '너겟', '고로케',
    ],
  },
]

const MIN_HIGHLIGHT_SCORE = 7

function normalizeMealName(name: string) {
  return name.replace(/\s/g, '').toLowerCase()
}

export function getMealPreferenceScore(name: string, categories: MealCategoryId[]) {
  const normalized = normalizeMealName(name)
  const categoryScore = categories.reduce(
    (highest, id) => Math.max(highest, MEAL_CATEGORIES[id].score),
    0,
  )
  const calibratedScore = MEAL_PREFERENCE_RULES.reduce((highest, rule) => {
    const matches = rule.keywords.some((keyword) => normalized.includes(normalizeMealName(keyword)))
    return matches ? Math.max(highest, rule.score) : highest
  }, 0)
  return Math.max(categoryScore, calibratedScore)
}

export function getMealHighlights(items: MealItem[]) {
  return items
    .map((item) => {
      const normalized = normalizeMealName(item.name)
      const categories = (Object.entries(MEAL_CATEGORIES) as [MealCategoryId, (typeof MEAL_CATEGORIES)[MealCategoryId]][])
        .filter(([, category]) => category.keywords.some((keyword) => normalized.includes(normalizeMealName(keyword))))
        .map(([id]) => id)
      return { ...item, categories, score: getMealPreferenceScore(item.name, categories) }
    })
    .filter((item) => item.score >= MIN_HIGHLIGHT_SCORE)
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
