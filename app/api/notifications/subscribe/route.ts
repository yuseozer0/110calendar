import { createHash } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

function tokenId(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 })
  }

  try {
    const body = (await request.json()) as { token?: unknown }
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    if (token.length < 50 || token.length > 4096) {
      return NextResponse.json({ error: '알림 토큰이 올바르지 않습니다.' }, { status: 400 })
    }

    const { db } = getFirebaseAdmin()
    await db.collection('pushTokens').doc(tokenId(token)).set(
      {
        token,
        userAgent: request.headers.get('user-agent')?.slice(0, 500) ?? '',
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[push] subscribe failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 등록에 실패했습니다.' },
      { status: 503 },
    )
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 })
  }

  try {
    const body = (await request.json()) as { token?: unknown }
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    if (!token) return NextResponse.json({ ok: true })

    const { db } = getFirebaseAdmin()
    await db.collection('pushTokens').doc(tokenId(token)).delete()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[push] unsubscribe failed:', error)
    return NextResponse.json({ error: '알림 해제에 실패했습니다.' }, { status: 503 })
  }
}
