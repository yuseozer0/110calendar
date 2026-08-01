export type CategoryId =
  | 'performance'
  | 'presentation'
  | 'exam'
  | 'event'
  | 'supplies'
  | 'notice'
  | 'etc'

export interface Category {
  id: CategoryId
  label: string
  /** Solid color used for dots, badge text, and accents */
  color: string
  /** Soft tinted background for badges */
  softBg: string
}

export const CATEGORIES: Category[] = [
  { id: 'performance', label: '수행평가', color: '#0f766e', softBg: '#0f766e1f' },
  { id: 'presentation', label: '발표', color: '#b45309', softBg: '#b453091f' },
  { id: 'exam', label: '시험', color: '#b91c1c', softBg: '#b91c1c1f' },
  { id: 'event', label: '학교 행사', color: '#1d4ed8', softBg: '#1d4ed81f' },
  { id: 'supplies', label: '준비물', color: '#a16207', softBg: '#a162071f' },
  { id: 'notice', label: '공지', color: '#0891b2', softBg: '#0891b21f' },
  { id: 'etc', label: '기타', color: '#57534e', softBg: '#57534e1f' },
]

export const CATEGORY_MAP: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category
    return acc
  },
  {} as Record<CategoryId, Category>,
)

export function getCategory(id: CategoryId): Category {
  return CATEGORY_MAP[id] ?? CATEGORY_MAP.etc
}
