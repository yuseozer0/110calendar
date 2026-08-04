import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
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
      auth: getAuth(existing),
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
    auth: getAuth(app),
    db: getFirestore(app),
    messaging: getMessaging(app),
  }
}
