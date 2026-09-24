'use client'

import { SlidersHorizontal } from 'lucide-react'
import { formatMoney } from '@/lib/finance-data'
import { useFinance } from '@/components/finance-provider'

export function BudgetBreakdown() {
  const { budgets, setManageCategoriesOpen } = useFinance()

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Presupuesto por categoría</h2>
          <p className="text-sm text-muted-foreground">Cómo se reparte tu gasto este mes</p>
        </div>
        <button
          type="button"
          onClick={() => setManageCategoriesOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-muted"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          Gestionar
        </button>
      </div>

      {budgets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no tienes categorías de gasto. Crea una para empezar.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {budgets.map((b) => {
            const hasLimit = b.limit > 0
            const pct = hasLimit ? Math.min(100, Math.round((b.spent / b.limit) * 100)) : b.spent > 0 ? 100 : 0
            const over = hasLimit && b.spent > b.limit
            return (
              <li key={b.category.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: b.color }} aria-hidden="true" />
                    {b.category.emoji} {b.category.name}
                  </span>
                  <span className="text-muted-foreground">
                    <span className={over ? 'font-bold text-accent' : 'font-bold text-foreground'}>
                      {formatMoney(b.spent)}
                    </span>
                    {hasLimit ? <> {' / '}{formatMoney(b.limit)}</> : <span className="text-xs"> · sin límite</span>}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: over ? 'var(--accent)' : b.color }}
                  />
                </div>
                {over && (
                  <p className="text-xs font-medium text-accent">
                    Te pasaste {formatMoney(b.spent - b.limit)} del límite
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
