import { budgets, formatMoney } from '@/lib/finance-data'

export function BudgetBreakdown() {
  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h2 className="font-display text-lg font-bold">Presupuesto por categoría</h2>
        <p className="text-sm text-muted-foreground">Cómo se reparte tu gasto este mes</p>
      </div>

      <ul className="flex flex-col gap-4">
        {budgets.map((b) => {
          const pct = Math.min(100, Math.round((b.spent / b.limit) * 100))
          const over = b.spent > b.limit
          return (
            <li key={b.category} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: b.color }} aria-hidden="true" />
                  {b.category}
                </span>
                <span className="text-muted-foreground">
                  <span className={over ? 'font-bold text-accent' : 'font-bold text-foreground'}>
                    {formatMoney(b.spent)}
                  </span>{' '}
                  / {formatMoney(b.limit)}
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
    </section>
  )
}
