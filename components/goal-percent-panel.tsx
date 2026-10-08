'use client'

import { useState } from 'react'
import { AlertTriangle, Equal, Save } from 'lucide-react'
import { useFinance } from '@/components/finance-provider'
import { formatMoney, roundMoney } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

export function GoalPercentPanel() {
  const { goals, setGoalPercentages } = useFinance()
  const autoGoals = goals.filter((g) => g.isAuto)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const valueOf = (id: string, stored: number) => drafts[id] ?? String(stored)
  const numeric = (id: string, stored: number) => Math.max(0, Number.parseFloat(valueOf(id, stored)) || 0)

  const total = roundMoney(autoGoals.reduce((s, g) => s + numeric(g.id, g.percentage), 0))
  const over = total > 100.001
  const invalid = autoGoals.some((g) => numeric(g.id, g.percentage) > 100)
  const dirty = autoGoals.some((g) => drafts[g.id] !== undefined && numeric(g.id, g.percentage) !== g.percentage)

  function splitEvenly() {
    if (autoGoals.length === 0) return
    const each = Math.floor(10000 / autoGoals.length) / 100
    setDrafts(Object.fromEntries(autoGoals.map((g) => [g.id, String(each)])))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await setGoalPercentages(Object.fromEntries(autoGoals.map((g) => [g.id, numeric(g.id, g.percentage)])))
      setDrafts({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los porcentajes')
    } finally {
      setSaving(false)
    }
  }

  if (autoGoals.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground text-pretty">
        Ninguna meta está en modo automático, así que no hay porcentajes que repartir.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Porcentaje por meta</p>
        <button
          type="button"
          onClick={splitEvenly}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Equal className="size-3.5" aria-hidden="true" />
          Igualar
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {autoGoals.map((goal) => (
          <li key={goal.id} className="flex items-center justify-between gap-3">
            <label htmlFor={`pct-${goal.id}`} className="flex min-w-0 items-center gap-2 text-sm">
              <span aria-hidden="true">{goal.emoji}</span>
              <span className="truncate font-medium">{goal.name}</span>
            </label>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted-foreground">{formatMoney(goal.saved)}</span>
              <div className="relative">
                <input
                  id={`pct-${goal.id}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="1"
                  value={valueOf(goal.id, goal.percentage)}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                  className={cn(
                    'w-20 rounded-xl border bg-background py-1.5 pl-2.5 pr-6 text-right text-sm font-semibold outline-none transition-colors focus:ring-2',
                    over || numeric(goal.id, goal.percentage) > 100
                      ? 'border-accent focus:border-accent focus:ring-accent/20'
                      : 'border-border focus:border-primary focus:ring-primary/20',
                  )}
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1.5">
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(100, total)}
          aria-label="Porcentaje total asignado"
        >
          <div
            className={cn('h-full rounded-full transition-all', over ? 'bg-accent' : 'bg-primary')}
            style={{ width: `${Math.min(100, total)}%` }}
          />
        </div>
        <p className={cn('text-xs font-semibold', over ? 'text-accent' : 'text-muted-foreground')}>
          {over
            ? `Asignaste ${total}% en total: te pasas por ${roundMoney(total - 100)}%`
            : `Asignado ${total}% de 100% (sin asignar ${roundMoney(100 - total)}%)`}
        </p>
      </div>

      {(over || invalid) && (
        <p className="flex gap-2 rounded-xl bg-accent/12 px-3 py-2.5 text-sm font-medium text-accent" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {invalid
            ? 'Cada porcentaje debe estar entre 0 y 100.'
            : 'La suma de los porcentajes no puede superar 100%. Reduce alguno para poder guardar.'}
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-accent/12 px-3 py-2.5 text-sm font-medium text-accent" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || over || invalid || saving}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity disabled:pointer-events-none disabled:opacity-50"
      >
        <Save className="size-4" aria-hidden="true" />
        {saving ? 'Guardando…' : 'Guardar porcentajes'}
      </button>
    </div>
  )
}
