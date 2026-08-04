import { FieldPath } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
])

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization') ?? ''
    const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!idToken) {
      return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401 })
    }

    const body = (await request.json()) as { scheduleId?: unknown; action?: unknown }
    const scheduleId = typeof body.scheduleId === 'string' ? body.scheduleId : ''
    const action = body.action === 'updated' ? 'updated' : 'created'
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(scheduleId)) {
      return NextResponse.json({ error: '일정 ID가 올바르지 않습니다.' }, { status: 400 })
    }

    const { auth, db, messaging } = getFirebaseAdmin()
    const decoded = await auth.verifyIdToken(idToken)
    const adminSnap = await db.collection('admins').doc(decoded.uid).get()
    if (!adminSnap.exists) {
      return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 })
    }

    const scheduleSnap = await db.collection('schedules').doc(scheduleId).get()
    if (!scheduleSnap.exists) {
      return NextResponse.json({ error: '일정을 찾을 수 없습니다.' }, { status: 404 })
    }

    const schedule = scheduleSnap.data() ?? {}
    const eventTitle = typeof schedule.title === 'string' ? schedule.title : '학급 일정'
    const startDate = typeof schedule.date === 'string' ? schedule.date : ''
    const endDate = typeof schedule.endDate === 'string' ? schedule.endDate : ''
    const dateLabel = endDate && endDate !== startDate ? `${startDate} ~ ${endDate}` : startDate
    const title = schedule.isPinned === true
      ? '📌 중요 공지가 등록됐어요'
      : action === 'updated'
        ? '일정이 변경됐어요'
        : '새 일정이 등록됐어요'

    const tokenSnapshot = await db.collection('pushTokens').orderBy(FieldPath.documentId()).limit(2000).get()
    const tokenDocs = tokenSnapshot.docs.filter((doc) => typeof doc.data().token === 'string')
    let successCount = 0
    let failureCount = 0

    for (let index = 0; index < tokenDocs.length; index += 500) {
      const chunk = tokenDocs.slice(index, index + 500)
      const response = await messaging.sendEachForMulticast({
        tokens: chunk.map((doc) => doc.data().token as string),
        notification: {
          title,
          body: dateLabel ? `${eventTitle} · ${dateLabel}` : eventTitle,
        },
        webpush: {
          notification: {
            icon: '/app-icon-192.png',
            badge: '/app-icon-192.png',
            tag: `schedule-${scheduleId}`,
          },
          fcmOptions: {
            link: process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin,
          },
        },
      })

      successCount += response.successCount
      failureCount += response.failureCount
      const deletions = response.responses.flatMap((result, responseIndex) => {
        const code = result.error?.code
        return code && INVALID_TOKEN_CODES.has(code) ? [chunk[responseIndex].ref.delete()] : []
      })
      await Promise.all(deletions)
    }

    return NextResponse.json({ ok: true, successCount, failureCount })
  } catch (error) {
    console.error('[push] send failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 발송에 실패했습니다.' },
      { status: 503 },
    )
  }
}
