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
import type { ClassEvent, EventDraft } from '@/lib/types'
import type { CategoryId } from '@/lib/categories'
import { useFirebase } from '@/components/firebase-provider'

const COLLECTION = 'schedules'

export interface NotificationStatus {
  kind: 'success' | 'warning'
  message: string
}

/** Remove keys with undefined values (Firestore rejects undefined). */
function toDocData(draft: EventDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {
    title: draft.title,
    date: draft.date,
    category: draft.category,
  }
  if (draft.time) data.time = draft.time
  if (draft.description) data.description = draft.description
  if (draft.endDate && draft.endDate !== draft.date) data.endDate = draft.endDate
  if (draft.isDday) data.isDday = true
  if (draft.isPinned) data.isPinned = true
  return data
}

export function useEvents() {
  const { auth, db, ready } = useFirebase()
  const [events, setEvents] = useState<ClassEvent[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null)

  const sendScheduleNotification = useCallback(
    async (scheduleId: string, action: 'created' | 'updated') => {
      setNotificationStatus(null)
      const currentUser = auth?.currentUser
      if (!currentUser) {
        setNotificationStatus({ kind: 'warning', message: '일정은 저장됐지만 관리자 로그인이 풀려 알림을 보내지 못했습니다.' })
        return
      }
      try {
        const idToken = await currentUser.getIdToken()
        const response = await fetch('/api/notifications/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scheduleId, action }),
        })
        const result = (await response.json()) as { error?: string; successCount?: number; failureCount?: number }
        if (!response.ok) {
          const message = result.error ?? response.statusText
          console.warn('[push] notification skipped:', message)
          setNotificationStatus({ kind: 'warning', message: `일정은 저장됐지만 알림 발송에 실패했습니다: ${message}` })
          return
        }
        const successCount = result.successCount ?? 0
        const failureCount = result.failureCount ?? 0
        setNotificationStatus(successCount > 0
          ? {
              kind: 'success',
              message: failureCount > 0
                ? `알림을 ${successCount}대에 보냈고 ${failureCount}대는 실패했습니다.`
                : `알림을 ${successCount}대에 보냈습니다.`,
            }
          : failureCount > 0
            ? { kind: 'warning', message: `일정은 저장됐지만 등록된 기기 ${failureCount}대의 알림 토큰이 만료되었습니다. 해당 기기에서 알림을 껐다가 다시 켜 주세요.` }
            : { kind: 'warning', message: '일정은 저장됐지만 알림을 받을 기기가 아직 등록되지 않았습니다.' })
      } catch (notificationError) {
        console.warn('[push] notification skipped:', notificationError)
        setNotificationStatus({
          kind: 'warning',
          message: `일정은 저장됐지만 알림 발송에 실패했습니다: ${notificationError instanceof Error ? notificationError.message : '알 수 없는 오류'}`,
        })
      }
    },
    [auth],
  )

  // Realtime subscription to the schedules collection.
  useEffect(() => {
    if (!db) {
      // No Firebase configured — nothing to load.
      if (!ready) setLoaded(true)
      return
    }
    const unsub = onSnapshot(
      collection(db, COLLECTION),
      (snapshot) => {
        const next: ClassEvent[] = snapshot.docs.map((d) => {
          const data = d.data() as Record<string, unknown>
          return {
            id: d.id,
            title: (data.title as string) ?? '',
            date: (data.date as string) ?? '',
            endDate: typeof data.endDate === 'string' ? data.endDate : undefined,
            time: (data.time as string) || undefined,
            category: (data.category as CategoryId) ?? 'etc',
            description: (data.description as string) || undefined,
            isDday: data.isDday === true,
            isPinned: data.isPinned === true,
            createdAt:
              typeof data.createdAt === 'number'
                ? (data.createdAt as number)
                : (data.createdAt as { toMillis?: () => number } | undefined)
                    ?.toMillis?.() ?? 0,
          }
        })
        setEvents(next)
        setLoaded(true)
        setError(null)
      },
      (err) => {
        console.log('[v0] schedules subscription error:', err)
        setError('일정을 불러오지 못했습니다.')
        setLoaded(true)
      },
    )
    return () => unsub()
  }, [db, ready])

  const addEvent = useCallback(
    async (draft: EventDraft) => {
      if (!db) throw new Error('Firebase가 설정되지 않았습니다.')
      const added = await addDoc(collection(db, COLLECTION), {
        ...toDocData(draft),
        createdAt: serverTimestamp(),
      })
      await sendScheduleNotification(added.id, 'created')
    },
    [db, sendScheduleNotification],
  )

  const updateEvent = useCallback(
    async (id: string, draft: EventDraft) => {
      if (!db) throw new Error('Firebase가 설정되지 않았습니다.')
      await updateDoc(doc(db, COLLECTION, id), {
        ...toDocData(draft),
        // Clear optional fields when removed.
        time: draft.time ?? null,
        description: draft.description ?? null,
        endDate: draft.endDate && draft.endDate !== draft.date ? draft.endDate : null,
        isDday: draft.isDday === true,
        isPinned: draft.isPinned === true,
      })
      await sendScheduleNotification(id, 'updated')
    },
    [db, sendScheduleNotification],
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!db) throw new Error('Firebase가 설정되지 않았습니다.')
      await deleteDoc(doc(db, COLLECTION, id))
    },
    [db],
  )

  return {
    events,
    loaded,
    error,
    notificationStatus,
    clearNotificationStatus: () => setNotificationStatus(null),
    addEvent,
    updateEvent,
    deleteEvent,
  }
}
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
import type { ClassEvent, EventDraft } from '@/lib/types'
import type { CategoryId } from '@/lib/categories'
import { useFirebase } from '@/components/firebase-provider'

const COLLECTION = 'schedules'

export interface NotificationStatus {
  kind: 'success' | 'warning'
  message: string
}

/** Remove keys with undefined values (Firestore rejects undefined). */
function toDocData(draft: EventDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {
    title: draft.title,
    date: draft.date,
    category: draft.category,
  }
  if (draft.time) data.time = draft.time
  if (draft.description) data.description = draft.description
  if (draft.endDate && draft.endDate !== draft.date) data.endDate = draft.endDate
  if (draft.isDday) data.isDday = true
  if (draft.isPinned) data.isPinned = true
  return data
}

export function useEvents() {
  const { auth, db, ready } = useFirebase()
  const [events, setEvents] = useState<ClassEvent[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null)

  const sendScheduleNotification = useCallback(
    async (scheduleId: string, action: 'created' | 'updated') => {
      setNotificationStatus(null)
      const currentUser = auth?.currentUser
      if (!currentUser) {
        setNotificationStatus({ kind: 'warning', message: '일정은 저장됐지만 관리자 로그인이 풀려 알림을 보내지 못했습니다.' })
        return
      }
      try {
        const idToken = await currentUser.getIdToken()
        const response = await fetch('/api/notifications/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scheduleId, action }),
        })
        const result = (await response.json()) as { error?: string; successCount?: number; failureCount?: number }
        if (!response.ok) {
          const message = result.error ?? response.statusText
          console.warn('[push] notification skipped:', message)
          setNotificationStatus({ kind: 'warning', message: `일정은 저장됐지만 알림 발송에 실패했습니다: ${message}` })
          return
        }
        const successCount = result.successCount ?? 0
        const failureCount = result.failureCount ?? 0
        setNotificationStatus(successCount > 0
          ? {
              kind: 'success',
              message: failureCount > 0
                ? `알림을 ${successCount}대에 보냈고 ${failureCount}대는 실패했습니다.`
                : `알림을 ${successCount}대에 보냈습니다.`,
            }
          : { kind: 'warning', message: '일정은 저장됐지만 알림을 받을 기기가 아직 등록되지 않았습니다.' })
      } catch (notificationError) {
        console.warn('[push] notification skipped:', notificationError)
        setNotificationStatus({
          kind: 'warning',
          message: `일정은 저장됐지만 알림 발송에 실패했습니다: ${notificationError instanceof Error ? notificationError.message : '알 수 없는 오류'}`,
        })
      }
    },
    [auth],
  )

  // Realtime subscription to the schedules collection.
  useEffect(() => {
    if (!db) {
      // No Firebase configured — nothing to load.
      if (!ready) setLoaded(true)
      return
    }
    const unsub = onSnapshot(
      collection(db, COLLECTION),
      (snapshot) => {
        const next: ClassEvent[] = snapshot.docs.map((d) => {
          const data = d.data() as Record<string, unknown>
          return {
            id: d.id,
            title: (data.title as string) ?? '',
            date: (data.date as string) ?? '',
            endDate: typeof data.endDate === 'string' ? data.endDate : undefined,
            time: (data.time as string) || undefined,
            category: (data.category as CategoryId) ?? 'etc',
            description: (data.description as string) || undefined,
            isDday: data.isDday === true,
            isPinned: data.isPinned === true,
            createdAt:
              typeof data.createdAt === 'number'
                ? (data.createdAt as number)
                : (data.createdAt as { toMillis?: () => number } | undefined)
                    ?.toMillis?.() ?? 0,
          }
        })
        setEvents(next)
        setLoaded(true)
        setError(null)
      },
      (err) => {
        console.log('[v0] schedules subscription error:', err)
        setError('일정을 불러오지 못했습니다.')
        setLoaded(true)
      },
    )
    return () => unsub()
  }, [db, ready])

  const addEvent = useCallback(
    async (draft: EventDraft) => {
      if (!db) throw new Error('Firebase가 설정되지 않았습니다.')
      const added = await addDoc(collection(db, COLLECTION), {
        ...toDocData(draft),
        createdAt: serverTimestamp(),
      })
      await sendScheduleNotification(added.id, 'created')
    },
    [db, sendScheduleNotification],
  )

  const updateEvent = useCallback(
    async (id: string, draft: EventDraft) => {
      if (!db) throw new Error('Firebase가 설정되지 않았습니다.')
      await updateDoc(doc(db, COLLECTION, id), {
        ...toDocData(draft),
        // Clear optional fields when removed.
        time: draft.time ?? null,
        description: draft.description ?? null,
        endDate: draft.endDate && draft.endDate !== draft.date ? draft.endDate : null,
        isDday: draft.isDday === true,
        isPinned: draft.isPinned === true,
      })
      await sendScheduleNotification(id, 'updated')
    },
    [db, sendScheduleNotification],
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!db) throw new Error('Firebase가 설정되지 않았습니다.')
      await deleteDoc(doc(db, COLLECTION, id))
    },
    [db],
  )

  return {
    events,
    loaded,
    error,
    notificationStatus,
    clearNotificationStatus: () => setNotificationStatus(null),
    addEvent,
    updateEvent,
    deleteEvent,
  }
}
