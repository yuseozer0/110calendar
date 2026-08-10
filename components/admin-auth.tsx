'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { LogIn, LogOut, ShieldCheck, X } from 'lucide-react'
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
    case 'auth/too-many-requests':
      return '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.'
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인해 주세요.'
    default:
      return error instanceof Error ? error.message : '로그인에 실패했습니다.'
  }
}

export function AdminAuthButton({ compact = false }: { compact?: boolean }) {
  const { user, isAdmin, authLoading, signOut } = useFirebase()
  const [open, setOpen] = useState(false)

  if (authLoading) {
    return (
      <Button variant="outline" size={compact ? 'icon' : 'sm'} disabled>
        <ShieldCheck className="size-4" />
        {!compact && '확인 중'}
      </Button>
    )
  }

  if (user && isAdmin) {
    return (
      <Button
        variant="outline"
        size={compact ? 'icon' : 'sm'}
        onClick={() => void signOut()}
        aria-label="관리자 로그아웃"
      >
        <LogOut className="size-4" />
        {!compact && '로그아웃'}
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size={compact ? 'icon' : 'sm'}
        onClick={() => setOpen(true)}
        aria-label="관리자 로그인"
      >
        <LogIn className="size-4" />
        {!compact && '관리자 로그인'}
      </Button>
      <AdminLoginDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function AdminLoginDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, user, isAdmin } = useFirebase()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async (event: React.FormEvent) => {
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

  return createPortal(
    <div
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-background sm:flex sm:items-center sm:justify-center sm:bg-foreground/40 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="관리자 로그인"
      onClick={onClose}
    >
      <div
        className="mx-auto min-h-dvh w-full max-w-md overflow-y-auto bg-card p-5 pt-safe pb-safe sm:min-h-0 sm:max-h-[calc(100dvh_-_2rem)] sm:rounded-2xl sm:border sm:border-border"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">관리자 로그인</h2>
            <p className="text-sm text-muted-foreground">등록된 관리자 계정만 일정을 수정할 수 있어요.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
            <X className="size-4" />
          </Button>
        </div>

        {user && !isAdmin && (
          <p className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            이 계정은 관리자 권한이 없습니다.
          </p>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
