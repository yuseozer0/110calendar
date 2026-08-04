import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

interface ServiceAccountShape {
  project_id?: string
  client_email?: string
  private_key?: string
}

function readServiceAccount(): ServiceAccountShape {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (json) {
    try {
      return JSON.parse(json) as ServiceAccountShape
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY가 올바른 JSON 형식이 아닙니다.')
    }
  }

  return {
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
}

export function getFirebaseAdmin() {
  const existing = getApps()[0]
  if (existing) {
    return {
      db: getFirestore(existing),
      messaging: getMessaging(existing),
    }
  }

  const serviceAccount = readServiceAccount()
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Firebase 관리자 서비스 계정이 설정되지 않았습니다.')
  }

  const app = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  })

  return {
    db: getFirestore(app),
    messaging: getMessaging(app),
  }
}

/** Verify a Firebase ID token without loading firebase-admin/auth.
 *
 * firebase-admin/auth currently pulls an ESM-only dependency into Vercel's
 * CommonJS function runtime. Firebase Auth's accounts:lookup endpoint performs
 * the same token validation and returns the authenticated user's UID.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string }> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) throw new Error('Firebase API 키가 설정되지 않았습니다.')

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      cache: 'no-store',
    },
  )

  if (!response.ok) throw new Error('관리자 로그인이 만료되었습니다. 다시 로그인해 주세요.')
  const result = (await response.json()) as { users?: Array<{ localId?: unknown }> }
  const uid = result.users?.[0]?.localId
  if (typeof uid !== 'string' || !uid) throw new Error('로그인 정보를 확인하지 못했습니다.')
  return { uid }
}
