'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { useFirebase } from '@/components/firebase-provider'
import type { Category, CategoryId } from '@/lib/categories'

const COLORS = ['#7c3aed', '#db2777', '#ea580c', '#0284c7', '#059669', '#4f46e5', '#ca8a04', '#be123c']
const COLLECTION = 'personalCategories'

function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function usePersonalCategories() {
  const { db, user } = useFirebase()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (!db || !user) {
      setCategories([])
      return
    }
    return onSnapshot(collection(db, 'users', user.uid, COLLECTION), (snapshot) => {
      const next = snapshot.docs
        .map((item) => {
          const data = item.data() as Record<string, unknown>
          const label = typeof data.label === 'string' ? data.label : ''
          const color = typeof data.color === 'string' ? data.color : '#7c3aed'
          const createdAt = typeof data.createdAt === 'number'
            ? data.createdAt
            : (data.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
          return {
            category: {
              id: `custom_${item.id}` as CategoryId,
              label,
              color,
              softBg: `${color}1f`,
            },
            createdAt,
          }
        })
        .filter((item) => item.category.label)
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((item) => item.category)
      setCategories(next)
    })
  }, [db, user])

  const addCategory = useCallback(async (rawLabel: string) => {
    if (!db || !user) throw new Error('개인 카테고리는 로그인 후 만들 수 있습니다.')
    const label = normalizeLabel(rawLabel)
    if (!label) throw new Error('카테고리 이름을 입력해 주세요.')
    if (label.length > 12) throw new Error('카테고리 이름은 12자 이하로 입력해 주세요.')
    if (categories.some((item) => item.label.toLocaleLowerCase() === label.toLocaleLowerCase())) {
      throw new Error('이미 같은 이름의 개인 카테고리가 있습니다.')
    }
    if (categories.length >= 12) throw new Error('개인 카테고리는 최대 12개까지 만들 수 있습니다.')
    const color = COLORS[categories.length % COLORS.length]
    const added = await addDoc(collection(db, 'users', user.uid, COLLECTION), {
      label,
      color,
      createdAt: serverTimestamp(),
    })
    return `custom_${added.id}` as CategoryId
  }, [categories, db, user])

  const renameCategory = useCallback(async (category: Category, rawLabel: string) => {
    if (!db || !user || !category.id.startsWith('custom_')) return
    const label = normalizeLabel(rawLabel)
    if (!label) throw new Error('카테고리 이름을 입력해 주세요.')
    if (label.length > 12) throw new Error('카테고리 이름은 12자 이하로 입력해 주세요.')
    if (categories.some((item) => item.id !== category.id && item.label.toLocaleLowerCase() === label.toLocaleLowerCase())) {
      throw new Error('이미 같은 이름의 개인 카테고리가 있습니다.')
    }
    await updateDoc(doc(db, 'users', user.uid, COLLECTION, category.id.slice('custom_'.length)), { label })
  }, [categories, db, user])

  const deleteCategory = useCallback(async (category: Category) => {
    if (!db || !user || !category.id.startsWith('custom_')) return
    await deleteDoc(doc(db, 'users', user.uid, COLLECTION, category.id.slice('custom_'.length)))
  }, [db, user])

  return { categories, addCategory, renameCategory, deleteCategory }
}
