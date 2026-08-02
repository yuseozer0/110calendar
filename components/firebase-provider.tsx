'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'
import {
  type Auth,
  type User,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth'
import {
  type Firestore,
  doc,
  getDoc,
  getFirestore,
} from 'firebase/firestore'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

interface FirebaseContextValue {
  db: Firestore | null
  auth: Auth | null
  /** Currently signed-in user, if any. */
  user: User | null
  /** True when the signed-in user has an `admins/{uid}` document. */
  isAdmin: boolean
  /** Auth state still resolving. */
  authLoading: boolean
  /** True when the Firebase config was provided and the app initialized. */
  ready: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null)

export function FirebaseProvider({
  config,
  children,
}: {
  config: FirebaseConfig
  children: React.ReactNode
}) {
  const configured = Boolean(config.projectId && config.apiKey)

  const services = useMemo(() => {
    if (!configured) return { app: null as FirebaseApp | null, auth: null as Auth | null, db: null as Firestore | null }
    const app = getApps().length ? getApps()[0] : initializeApp(config)
    return { app, auth: getAuth(app), db: getFirestore(app) }
  }, [config, configured])

  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const auth = services.auth
    const db = services.db
    if (!auth || !db) {
      setAuthLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      if (nextUser) {
        try {
          const snap = await getDoc(doc(db, 'admins', nextUser.uid))
          setIsAdmin(snap.exists())
        } catch (error) {
          console.log('[v0] admin check failed:', error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setAuthLoading(false)
    })
    return () => unsub()
  }, [services])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!services.auth || !services.db) throw new Error('Firebase가 설정되지 않았습니다.')
      const credential = await signInWithEmailAndPassword(services.auth, email, password)
      const adminSnap = await getDoc(doc(services.db, 'admins', credential.user.uid))
      if (!adminSnap.exists()) {
        await fbSignOut(services.auth)
        throw new Error('관리자 권한이 없는 계정입니다.')
      }
    },
    [services],
  )

  const signOut = useCallback(async () => {
    if (!services.auth) return
    await fbSignOut(services.auth)
  }, [services])

  const value: FirebaseContextValue = {
    db: services.db,
    auth: services.auth,
    user,
    isAdmin,
    authLoading,
    ready: configured,
    signIn,
    signOut,
  }

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext)
  if (!ctx) {
    throw new Error('useFirebase must be used within a FirebaseProvider')
  }
  return ctx
}
