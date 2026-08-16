'use client'

import { useState } from 'react'
import { LogIn, LogOut, ShieldCheck, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFirebase } from '@/components/firebase-provider'

function authErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : ''

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return '이메일 또는 비밀번호가 올바르지 않습니다.'
    case 'auth/popup-closed-by-user':
      return '로그인 창이 닫혔습니다. 다시 시도해 주세요.'
    case 'auth/operation-not-allowed':
      return 'Google 로그인이 아직 사용 설정되지 않았습니다.'
    case 'auth/unauthorized-domain':
      return '현재 주소가 Firebase 로그인 허용 도메인에 등록되지 않았습니다.'
    case 'auth/too-many-requests':
      return '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.'
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인해 주세요.'
    default:
      return error instanceof Error ? error.message : '로그인에 실패했습니다.'
  }
}

export function AdminAuthButton({ compact = false }: { compact?: boolean }) {
  const { user, isAdmin, authLoading } = useFirebase()
  const [open, setOpen] = useState(false)

  if (authLoading) {
    return (
      <Button variant="outline" size={compact ? 'icon' : 'sm'} disabled>
        <UserRound className="size-4" />
        {!compact && '확인 중'}
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size={compact ? 'icon' : 'sm'}
        onClick={() => setOpen(true)}
        aria-label={user ? (isAdmin ? '관리자 계정' : '내 계정') : '개인 일정 로그인'}
      >
        {user ? (isAdmin ? <ShieldCheck className="size-4" /> : <UserRound className="size-4" />) : <LogIn className="size-4" />}
        {!compact && (user ? (isAdmin ? '관리자 계정' : '내 계정') : '개인 일정 로그인')}
      </Button>
      <AccountDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function AccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, isAdmin, signInWithGoogle, signIn, signOut } = useFirebase()
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleGoogleLogin = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await signInWithGoogle()
      onClose()
    } catch (loginError) {
      setError(authErrorMessage(loginError))
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      onClose()
    } catch (loginError) {
      setError(authErrorMessage(loginError))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await signOut()
      onClose()
    } catch (signOutError) {
      setError(authErrorMessage(signOutError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex min-h-0 items-end justify-center overflow-y-auto overscroll-contain bg-foreground/40 p-0 pt-safe sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={user ? '내 계정' : '로그인'}
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100dvh-env(safe-area-inset-top))] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card p-5 pb-safe sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{user ? '내 계정' : '개인 일정 로그인'}</h2>
            <p className="text-sm text-muted-foreground">
              {user ? '개인 일정은 이 계정에 안전하게 저장돼요.' : '로그인하면 개인 일정을 여러 기기에서 볼 수 있어요.'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
            <X className="size-4" />
          </Button>
        </div>

        {user ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {isAdmin ? <ShieldCheck className="size-5" /> : <UserRound className="size-5" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.displayName || (isAdmin ? '관리자' : '110 캘린더 사용자')}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {isAdmin ? '학급 공개 일정과 개인 일정을 모두 관리할 수 있어요.' : '나만 볼 수 있는 개인 일정을 등록하고 수정할 수 있어요.'}
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button variant="outline" onClick={() => void handleSignOut()} disabled={submitting}>
              <LogOut className="size-4" />
              로그아웃
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Button onClick={() => void handleGoogleLogin()} disabled={submitting}>
              <UserRound className="size-4" />
              {submitting ? '로그인 중...' : 'Google로 개인 일정 시작'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">학급 일정과 급식은 로그인 없이 계속 볼 수 있어요.</p>

            <div className="border-t border-border pt-4">
              {!showAdminLogin ? (
                <button
                  type="button"
                  className="w-full text-center text-sm font-medium text-muted-foreground underline"
                  onClick={() => {
                    setShowAdminLogin(true)
                    setError(null)
                  }}
                >
                  관리자 로그인
                </button>
              ) : (
                <form className="flex flex-col gap-3" onSubmit={handleAdminLogin}>
                  <p className="text-sm font-medium">관리자 이메일 로그인</p>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-email" className="text-sm font-medium">이메일</label>
                    <input
                      id="admin-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-password" className="text-sm font-medium">비밀번호</label>
                    <input
                      id="admin-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <Button type="submit" variant="outline" disabled={submitting}>
                    {submitting ? '로그인 중...' : '관리자 로그인'}
                  </Button>
                </form>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
