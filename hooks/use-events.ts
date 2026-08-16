'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import type { ClassEvent, EventDraft, EventVisibility } from '@/lib/types'
import type { CategoryId } from '@/lib/categories'
import { compressScheduleImage } from '@/lib/image-utils'
import { useFirebase } from '@/components/firebase-provider'

const CLASS_COLLECTION = 'schedules'
const PERSONAL_COLLECTION = 'personalSchedules'

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
  if (draft.imageUrl) data.imageUrl = draft.imageUrl
  if (draft.endDate && draft.endDate !== draft.date) data.endDate = draft.endDate
  if (draft.isDday) data.isDday = true
  if (draft.isPinned) data.isPinned = true
  return data
}

function fromDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  visibility: EventVisibility,
  ownerId?: string,
): ClassEvent {
  const data = snapshot.data() as Record<string, unknown>
  return {
    id: snapshot.id,
    title: (data.title as string) ?? '',
    date: (data.date as string) ?? '',
    endDate: typeof data.endDate === 'string' ? data.endDate : undefined,
    time: (data.time as string) || undefined,
    category: (data.category as CategoryId) ?? 'etc',
    description: (data.description as string) || undefined,
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
    isDday: data.isDday === true,
    isPinned: data.isPinned === true,
    visibility,
    ownerId,
    createdAt:
      typeof data.createdAt === 'number'
        ? (data.createdAt as number)
        : (data.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0,
  }
}

export function useEvents() {
  const { auth, db, ready, user, isAdmin } = useFirebase()
  const [classEvents, setClassEvents] = useState<ClassEvent[]>([])
  const [privateEvents, setPrivateEvents] = useState<ClassEvent[]>([])
  const [classLoaded, setClassLoaded] = useState(false)
  const [privateLoaded, setPrivateLoaded] = useState(true)
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

  useEffect(() => {
    if (!db) {
      if (!ready) setClassLoaded(true)
      return
    }
    const unsubscribe = onSnapshot(
      collection(db, CLASS_COLLECTION),
      (snapshot) => {
        setClassEvents(snapshot.docs.map((item) => fromDoc(item, 'class')))
        setClassLoaded(true)
        setError(null)
      },
      (snapshotError) => {
        console.log('[v0] schedules subscription error:', snapshotError)
        setError('학급 일정을 불러오지 못했습니다.')
        setClassLoaded(true)
      },
    )
    return () => unsubscribe()
  }, [db, ready])

  useEffect(() => {
    if (!db || !user) {
      setPrivateEvents([])
      setPrivateLoaded(true)
      return
    }
    setPrivateLoaded(false)
    const unsubscribe = onSnapshot(
      collection(db, 'users', user.uid, PERSONAL_COLLECTION),
      (snapshot) => {
        setPrivateEvents(snapshot.docs.map((item) => fromDoc(item, 'private', user.uid)))
        setPrivateLoaded(true)
        setError(null)
      },
      (snapshotError) => {
        console.log('[private schedules] subscription error:', snapshotError)
        setError('개인 일정을 불러오지 못했습니다. 보안 규칙을 확인해 주세요.')
        setPrivateLoaded(true)
      },
    )
    return () => unsubscribe()
  }, [db, user])

  const addEvent = useCallback(
    async (draft: EventDraft) => {
      if (!db) throw new Error('Firebase가 설정되지 않았습니다.')
      const imageUrl = draft.imageFile ? await compressScheduleImage(draft.imageFile) : draft.imageUrl
      const data = {
        ...toDocData({ ...draft, imageUrl }),
        createdAt: serverTimestamp(),
      }

      if (draft.visibility === 'private') {
        const currentUser = auth?.currentUser
        if (!currentUser) throw new Error('개인 일정은 Google 로그인 후 저장할 수 있습니다.')
        await addDoc(collection(db, 'users', currentUser.uid, PERSONAL_COLLECTION), {
          ...data,
          ownerId: currentUser.uid,
        })
        setNotificationStatus({ kind: 'success', message: '나만 볼 수 있는 개인 일정으로 저장했습니다.' })
        return
      }

      if (!isAdmin) throw new Error('학급 공개 일정은 관리자만 저장할 수 있습니다.')
      const added = await addDoc(collection(db, CLASS_COLLECTION), data)
      await sendScheduleNotification(added.id, 'created')
    },
    [auth, db, isAdmin, sendScheduleNotification],
  )

  const updateEvent = useCallback(
    async (event: ClassEvent, draft: EventDraft) => {
      if (!db) throw new Error('Firebase가 설정되지 않았습니다.')
      const imageUrl = draft.imageFile
        ? await compressScheduleImage(draft.imageFile)
        : draft.removeImage
          ? null
          : draft.imageUrl ?? null
      const updates = {
        ...toDocData(draft),
        time: draft.time ?? null,
        description: draft.description ?? null,
        imageUrl,
        endDate: draft.endDate && draft.endDate !== draft.date ? draft.endDate : null,
        isDday: draft.isDday === true,
        isPinned: draft.isPinned === true,
      }

      if (event.visibility === 'private') {
        const currentUser = auth?.currentUser
        if (!currentUser || currentUser.uid !== event.ownerId) throw new Error('이 개인 일정을 수정할 권한이 없습니다.')
        await updateDoc(doc(db, 'users', currentUser.uid, PERSONAL_COLLECTION, event.id), {
          ...updates,
          ownerId: currentUser.uid,
        })
        setNotificationStatus({ kind: 'success', message: '개인 일정을 수정했습니다.' })
        return
      }

      if (!isAdmin) throw new Error('학급 공개 일정은 관리자만 수정할 수 있습니다.')
      await updateDoc(doc(db, CLASS_COLLECTION, event.id), updates)
      await sendScheduleNotification(event.id, 'updated')
    },
    [auth, db, isAdmin, sendScheduleNotification],
  )

  const deleteEvent = useCallback(
    async (event: ClassEvent) => {
      if (!db) throw new Error('Firebase가 설정되지 않았습니다.')
      if (event.visibility === 'private') {
        const currentUser = auth?.currentUser
        if (!currentUser || currentUser.uid !== event.ownerId) throw new Error('이 개인 일정을 삭제할 권한이 없습니다.')
        await deleteDoc(doc(db, 'users', currentUser.uid, PERSONAL_COLLECTION, event.id))
        return
      }
      if (!isAdmin) throw new Error('학급 공개 일정은 관리자만 삭제할 수 있습니다.')
      await deleteDoc(doc(db, CLASS_COLLECTION, event.id))
    },
    [auth, db, isAdmin],
  )

  return {
    events: [...classEvents, ...privateEvents],
    loaded: classLoaded && privateLoaded,
    error,
    notificationStatus,
    clearNotificationStatus: () => setNotificationStatus(null),
    addEvent,
    updateEvent,
    deleteEvent,
  }
}
