'use client'

import { useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { CATEGORIES, type Category, type CategoryId } from '@/lib/categories'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  active: CategoryId[]
  onToggle: (id: CategoryId) => void
  onReset: () => void
  categories?: Category[]
  personalCategories?: Category[]
  canManagePersonal?: boolean
  onAddCategory?: (label: string) => Promise<CategoryId>
  onRenameCategory?: (category: Category, label: string) => Promise<void>
  onDeleteCategory?: (category: Category) => Promise<void>
}

export function CategoryFilter({
  active,
  onToggle,
  onReset,
  categories = CATEGORIES,
  personalCategories = [],
  canManagePersonal = false,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}: CategoryFilterProps) {
  const allActive = active.length === 0
  const [managing, setManaging] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<CategoryId | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addCategory = async () => {
    if (!onAddCategory || saving) return
    setSaving(true)
    setError(null)
    try {
      await onAddCategory(newLabel)
      setNewLabel('')
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : '카테고리를 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const renameCategory = async (category: Category) => {
    if (!onRenameCategory || saving) return
    setSaving(true)
    setError(null)
    try {
      await onRenameCategory(category, editLabel)
      setEditingId(null)
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : '이름을 변경하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (category: Category) => {
    if (!onDeleteCategory || saving) return
    setSaving(true)
    setError(null)
    try {
      await onDeleteCategory(category)
      if (active.includes(category.id)) onToggle(category.id)
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : '카테고리를 삭제하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReset}
          aria-pressed={allActive}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            allActive
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-muted-foreground hover:bg-muted',
          )}
        >
          전체
        </button>
        {categories.map((category) => {
          const isActive = active.includes(category.id)
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onToggle(category.id)}
              aria-pressed={isActive}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'border-transparent'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted',
              )}
              style={isActive ? { backgroundColor: category.softBg, color: category.color } : undefined}
            >
              <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: category.color }} />
              {category.label}
            </button>
          )
        })}
      </div>

      {canManagePersonal && (
        <div>
          <button
            type="button"
            onClick={() => {
              setManaging((value) => !value)
              setError(null)
            }}
            className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-primary"
          >
            {managing ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
            {managing ? '관리 닫기' : '개인 카테고리 관리'}
          </button>
          {managing && (
            <div className="mt-2 space-y-2 rounded-xl border border-border bg-card p-3">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  void addCategory()
                }}
              >
                <input
                  value={newLabel}
                  onChange={(event) => setNewLabel(event.target.value)}
                  placeholder="예: 학원, 약속"
                  maxLength={12}
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button type="submit" disabled={saving || !newLabel.trim()} className="rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50">
                  추가
                </button>
              </form>
              {personalCategories.map((category) => (
                <div key={category.id} className="flex min-h-9 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                  {editingId === category.id ? (
                    <>
                      <input
                        value={editLabel}
                        onChange={(event) => setEditLabel(event.target.value)}
                        maxLength={12}
                        autoFocus
                        className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                      />
                      <button type="button" aria-label={`${category.label} 이름 저장`} onClick={() => void renameCategory(category)} disabled={saving} className="p-1.5 text-primary"><Check className="size-4" /></button>
                      <button type="button" aria-label="이름 변경 취소" onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground"><X className="size-4" /></button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm">{category.label}</span>
                      <button type="button" aria-label={`${category.label} 이름 변경`} onClick={() => { setEditingId(category.id); setEditLabel(category.label); setError(null) }} className="p-1.5 text-muted-foreground"><Pencil className="size-4" /></button>
                      <button type="button" aria-label={`${category.label} 삭제`} onClick={() => void deleteCategory(category)} disabled={saving} className="p-1.5 text-destructive"><Trash2 className="size-4" /></button>
                    </>
                  )}
                </div>
              ))}
              {personalCategories.length === 0 && <p className="text-xs text-muted-foreground">아직 만든 개인 카테고리가 없어요.</p>}
              {error && <p className="text-xs text-destructive">{error}</p>}
              <p className="text-[11px] leading-4 text-muted-foreground">삭제해도 이미 등록한 일정의 카테고리 표시는 유지돼요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
