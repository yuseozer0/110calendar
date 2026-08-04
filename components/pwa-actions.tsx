'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Download, Smartphone, X } from 'lucide-react'
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { Button } from '@/components/ui/button'
import { useFirebase } from '@/components/firebase-provider'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? ''
const TOKEN_STORAGE_KEY = '110calendar-fcm-token'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isInstalled(): boolean {
  if (typeof window === 'undefined') return false
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true
}

export function PwaActions({ compact = false }: { compact?: boolean }) {
  const { app } = useFirebase()
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [notificationSupported, setNotificationSupported] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setInstalled(isInstalled())
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIos(iosDevice)
    setIsAndroid(/Android/i.test(navigator.userAgent))
    setNotificationPermission('Notification' in window ? Notification.permission : 'denied')
    void isSupported().then(setNotificationSupported).catch(() => setNotificationSupported(false))

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    }

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  useEffect(() => {
    if (!app || notificationPermission !== 'granted') return
    let unsubscribe: (() => void) | undefined
    void isSupported().then((supported) => {
      if (!supported) return
      unsubscribe = onMessage(getMessaging(app), (payload) => {
        const title = payload.notification?.title ?? '110 캘린더'
        setMessage(title)
        void navigator.serviceWorker.ready.then((registration) =>
          registration.showNotification(title, {
            body: payload.notification?.body ?? '새로운 일정 소식이 있어요.',
            icon: '/app-icon-192.png',
            badge: '/app-icon-192.png',
            tag: typeof payload.data?.scheduleId === 'string' ? `schedule-${payload.data.scheduleId}` : '110calendar-update',
          }),
        )
      })
    })
    return () => unsubscribe?.()
  }, [app, notificationPermission])

  const handleInstall = async () => {
    setMessage(null)
    if (!installPrompt) {
      setShowInstallHelp(true)
      return
    }
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  const enableNotifications = async () => {
    if (!app || !notificationSupported || !VAPID_KEY || !('serviceWorker' in navigator)) return
    setWorking(true)
    setMessage(null)
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission !== 'granted') {
        setMessage('알림이 차단됐어요. 브라우저 설정에서 알림을 허용해 주세요.')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const messaging = getMessaging(app)
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      })
      if (!token) throw new Error('알림 토큰을 만들지 못했습니다.')

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(result.error ?? '알림 등록에 실패했습니다.')

      localStorage.setItem(TOKEN_STORAGE_KEY, token)
      setMessage('이제 새 일정과 중요 공지 알림을 받을 수 있어요.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알림 등록에 실패했습니다.')
    } finally {
      setWorking(false)
    }
  }

  const disableNotifications = async () => {
    if (!app) return
    setWorking(true)
    setMessage(null)
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY) ?? ''
      if (token) {
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
      }
      await deleteToken(getMessaging(app))
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      setNotificationPermission(Notification.permission)
      setMessage('이 기기의 일정 알림을 해제했어요.')
    } catch {
      setMessage('알림을 해제하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setWorking(false)
    }
  }

  const notificationReady = Boolean(app && notificationSupported && VAPID_KEY)
  const notificationsEnabled = notificationPermission === 'granted' && typeof window !== 'undefined' && Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
  const canOfferInstall = !installed

  return (
    <>
      <div className={compact ? 'flex items-center gap-1' : 'flex flex-col gap-2'}>
        {canOfferInstall && (
          <Button
            variant="outline"
            size={compact ? 'icon' : 'sm'}
            onClick={() => void handleInstall()}
            aria-label="앱 설치"
            className={compact ? undefined : 'w-full justify-center'}
          >
            {isIos ? <Smartphone className="size-4" /> : <Download className="size-4" />}
            {!compact && '앱 설치'}
          </Button>
        )}

        <Button
          variant="outline"
          size={compact ? 'icon' : 'sm'}
          onClick={() => void (notificationsEnabled ? disableNotifications() : enableNotifications())}
          disabled={working || !notificationReady}
          aria-label={notificationsEnabled ? '알림 끄기' : '알림 받기'}
          className={compact ? undefined : 'w-full justify-center'}
        >
          {notificationsEnabled ? <BellOff className="size-4" /> : <Bell className="size-4" />}
          {!compact && (notificationReady ? (notificationsEnabled ? '알림 끄기' : '알림 받기') : '알림 준비 중')}
        </Button>

        {!compact && message && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{message}</p>
        )}
      </div>

      {showInstallHelp && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/40 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="앱 설치 방법" onClick={() => setShowInstallHelp(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-card p-5 pb-safe sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{isIos ? '아이폰에 앱 설치하기' : isAndroid ? '안드로이드에 앱 설치하기' : '홈 화면에 앱 추가하기'}</h2>
              <Button variant="ghost" size="icon" aria-label="닫기" onClick={() => setShowInstallHelp(false)}>
                <X className="size-4" />
              </Button>
            </div>
            {isIos ? (
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>이 페이지를 <strong className="text-foreground">Safari</strong>에서 여세요.</li>
                <li>Safari 아래쪽의 <strong className="text-foreground">공유 버튼</strong>을 누르세요.</li>
                <li>메뉴를 위로 올려 <strong className="text-foreground">홈 화면에 추가</strong>를 선택하세요.</li>
                <li>추가한 110 캘린더 앱을 열고 <strong className="text-foreground">알림 받기</strong>를 누르세요.</li>
              </ol>
            ) : (
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>카카오톡·인스타그램 안이라면 메뉴에서 <strong className="text-foreground">Chrome으로 열기</strong>를 선택하세요.</li>
                <li>Chrome 오른쪽 위 <strong className="text-foreground">⋮ 메뉴</strong>를 누르세요.</li>
                <li><strong className="text-foreground">앱 설치</strong> 또는 <strong className="text-foreground">홈 화면에 추가</strong>를 선택하세요.</li>
                <li>추가한 110 캘린더 앱을 열고 <strong className="text-foreground">알림 받기</strong>를 누르세요.</li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  )
}
