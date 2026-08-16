'use client'

import { useEffect, useState } from 'react'
import { ImagePlus, Lock, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CATEGORIES, type CategoryId } from '@/lib/categories'
import type { ClassEvent, EventDraft, EventVisibility } from '@/lib/types'
import { cn } from '@/lib/utils'

interface EventDialogProps {
  open: boolean
  defaultDate: string
  editing: ClassEvent | null
  canCreateClass: boolean
  onClose: () => void
  onSave: (draft: EventDraft) => Promise<void>
}

export function EventDialog({ open, defaultDate, editing, canCreateClass, onClose, onSave }: EventDialogProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [endDate, setEndDate] = useState(defaultDate)
  const [time, setTime] = useState('')
  const [category, setCategory] = useState<CategoryId>('performance')
  const [description, setDescription] = useState('')
  const [isDday, setIsDday] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [visibility, setVisibility] = useState<EventVisibility>('private')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [removeImage, setRemoveImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (editing) {
      setTitle(editing.title)
      setDate(editing.date)
      setEndDate(editing.endDate ?? editing.date)
      setTime(editing.time ?? '')
      setCategory(editing.category)
      setDescription(editing.description ?? '')
      setIsDday(editing.isDday === true)
      setIsPinned(editing.isPinned === true)
      setVisibility(editing.visibility)
      setImageFile(null)
      setImagePreview(editing.imageUrl ?? '')
      setRemoveImage(false)
    } else {
      setTitle('')
      setDate(defaultDate)
      setEndDate(defaultDate)
      setTime('')
      setCategory('performance')
      setDescription('')
      setIsDday(false)
      setIsPinned(false)
      setVisibility(canCreateClass ? 'class' : 'private')
      setImageFile(null)
      setImagePreview('')
      setRemoveImage(false)
    }
  }, [open, editing, defaultDate, canCreateClass])

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, saving])

  if (!open) return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !date || !endDate || saving) return
    if (endDate < date) {
      setError('종료일은 시작일보다 빠를 수 없습니다.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title: title.trim(),
        date,
        endDate: endDate !== date ? endDate : undefined,
        time: time || undefined,
        category,
        description: description.trim() || undefined,
        imageUrl: !removeImage && !imageFile ? editing?.imageUrl : undefined,
        imageFile: imageFile ?? undefined,
        removeImage,
        isDday,
        isPinned,
        visibility,
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '일정을 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-0 items-end justify-center overflow-y-auto overscroll-contain bg-foreground/40 p-0 pt-safe sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? '일정 수정' : '일정 등록'}
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <div
        className="max-h-[calc(100dvh-env(safe-area-inset-top))] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card p-5 pb-safe sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{editing ? '일정 수정' : '일정 등록'}</h2>
          <Button variant="ghost" size="icon" aria-label="닫기" onClick={onClose} disabled={saving}>
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">공개 범위</span>
            <div className={cn('grid gap-2', canCreateClass && 'grid-cols-2')}>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                disabled={saving || Boolean(editing)}
                aria-pressed={visibility === 'private'}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-default',
                  visibility === 'private' ? 'border-primary bg-primary/8 text-foreground' : 'border-border bg-background text-muted-foreground',
                )}
              >
                <Lock className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="block text-sm font-medium">나만 보기</span>
                  <span className="block text-xs text-muted-foreground">내 계정에서만 보여요.</span>
                </span>
              </button>
              {canCreateClass && (
                <button
                  type="button"
                  onClick={() => setVisibility('class')}
                  disabled={saving || Boolean(editing)}
                  aria-pressed={visibility === 'class'}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-default',
                    visibility === 'class' ? 'border-primary bg-primary/8 text-foreground' : 'border-border bg-background text-muted-foreground',
                  )}
                >
                  <Users className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="block text-sm font-medium">학급에 공개</span>
                    <span className="block text-xs text-muted-foreground">모든 친구에게 보여요.</span>
                  </span>
                </button>
              )}
            </div>
            {editing && <p className="text-xs text-muted-foreground">수정 중에는 공개 범위를 변경할 수 없어요.</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-title" className="text-sm font-medium">제목</label>
            <input
              id="event-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 국어 수행평가"
              required
              autoFocus
              disabled={saving}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-date" className="text-sm font-medium">시작일</label>
              <input
                id="event-date"
                type="date"
                value={date}
                onChange={(event) => {
                  const nextDate = event.target.value
                  setDate(nextDate)
                  if (!endDate || endDate < nextDate) setEndDate(nextDate)
                }}
                required
                disabled={saving}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-end-date" className="text-sm font-medium">종료일</label>
              <input
                id="event-end-date"
                type="date"
                value={endDate}
                min={date}
                onChange={(event) => setEndDate(event.target.value)}
                required
                disabled={saving}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-time" className="text-sm font-medium">시간 (선택)</label>
            <input
              id="event-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              disabled={saving}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">카테고리</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((item) => {
                const isActive = category === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    aria-pressed={isActive}
                    disabled={saving}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
                      isActive ? 'border-transparent' : 'border-border bg-card text-muted-foreground hover:bg-muted',
                    )}
                    style={isActive ? { backgroundColor: item.softBg, color: item.color } : undefined}
                  >
                    <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3">
              <input
                type="checkbox"
                checked={isDday}
                onChange={(event) => setIsDday(event.target.checked)}
                disabled={saving}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                <span className="block text-sm font-medium">D-day 표시</span>
                <span className="block text-xs text-muted-foreground">중요 일정까지 남은 날짜를 보여줘요.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(event) => setIsPinned(event.target.checked)}
                disabled={saving}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                <span className="block text-sm font-medium">중요 공지로 고정</span>
                <span className="block text-xs text-muted-foreground">달력 위에 항상 표시해요.</span>
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-desc" className="text-sm font-medium">메모 (선택)</label>
            <textarea
              id="event-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="세부 내용, 준비물, 범위 등"
              disabled={saving}
              className="resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">사진 첨부 (선택)</span>
            {imagePreview ? (
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                <img src={imagePreview} alt="첨부 사진 미리보기" className="max-h-64 w-full object-contain" />
                <button
                  type="button"
                  className="w-full border-t border-border px-3 py-2 text-sm font-medium text-destructive"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview('')
                    setRemoveImage(true)
                  }}
                  disabled={saving}
                >
                  사진 삭제
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-5 text-sm font-medium text-muted-foreground">
                <ImagePlus className="size-5" />
                사진 선택
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={saving}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (!file) return
                    if (!file.type.startsWith('image/')) {
                      setError('이미지 파일만 첨부할 수 있습니다.')
                      return
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      setError('사진은 10MB 이하만 첨부할 수 있습니다.')
                      return
                    }
                    setError(null)
                    setImageFile(file)
                    setImagePreview(URL.createObjectURL(file))
                    setRemoveImage(false)
                  }}
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground">10MB 이하 사진 1장을 첨부할 수 있어요. 저장할 때 자동으로 용량을 줄입니다.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="mt-1 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={saving}>취소</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? '저장 중...' : editing ? '수정 완료' : '등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
