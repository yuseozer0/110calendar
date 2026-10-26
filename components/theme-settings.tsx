'use client'

import { useState } from 'react'
import { Check, Heart, Moon, Palette, Sparkles, Sun, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemePreferences, type CalendarDensity, type ThemePreset } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

const THEMES: Array<{ id: ThemePreset; label: string; icon: typeof Sun; preview: string }> = [
  { id: 'white', label: '화이트', icon: Sun, preview: 'bg-white text-slate-800 ring-slate-200' },
  { id: 'black', label: '블랙', icon: Moon, preview: 'bg-[#222225] text-white ring-white/15' },
  { id: 'pink', label: '블러시 핑크', icon: Heart, preview: 'bg-gradient-to-br from-[#fff7fa] to-[#edb7c8] text-[#4b222f] ring-[#e8bdca]' },
  { id: 'clean', label: '클린 걸', icon: Sparkles, preview: 'bg-gradient-to-br from-[#fffdf7] via-[#e9eadc] to-[#cbbca9] text-[#493c32] ring-[#d8d1c3]' },
]

export function ThemeSettings() {
  const [open, setOpen] = useState(false)
  const { theme, density, setTheme, setDensity } = useThemePreferences()

  return (
    <div className="relative">
      <Button variant="outline" size="icon" onClick={() => setOpen((value) => !value)} aria-label="테마 설정" aria-expanded={open}>
        <Palette className="size-4" />
      </Button>
      {open && (
        <>
          <button type="button" aria-label="테마 설정 닫기" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <section aria-label="테마 설정" className="theme-surface-shadow absolute right-0 top-11 z-50 max-h-[calc(100dvh-5rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">나의 테마</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="닫기"><X className="size-4" /></Button>
            </header>
            <SettingGroup label="테마">
              <div className="grid gap-2">
                {THEMES.map(({ id, label, icon: Icon, preview }) => (
                  <button key={id} type="button" onClick={() => setTheme(id)} aria-pressed={theme === id} className={cn('flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all', theme === id ? 'border-primary bg-primary/8 ring-1 ring-primary/30' : 'border-border hover:bg-muted/60')}>
                    <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg ring-1', preview)}><Icon className="size-5" /></span>
                    <span className="min-w-0 flex-1 text-sm font-semibold">{label}</span>
                    {theme === id && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            </SettingGroup>
            <SettingGroup label="캘린더 간격">
              <div className="grid grid-cols-2 gap-2">
                {(['comfortable', 'compact'] as CalendarDensity[]).map((id) => (
                  <ChoiceButton key={id} selected={density === id} onClick={() => setDensity(id)}>{id === 'comfortable' ? '여유롭게' : '촘촘하게'}</ChoiceButton>
                ))}
              </div>
            </SettingGroup>
          </section>
        </>
      )}
    </div>
  )
}

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4 last:mb-0"><p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>{children}</div>
}

function ChoiceButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className={cn('flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-2 text-sm font-medium transition-colors', selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:bg-muted')}>{children}</button>
}
