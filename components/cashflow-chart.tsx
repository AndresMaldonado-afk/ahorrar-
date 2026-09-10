import { cashflow, formatMoney } from '@/lib/finance-data'

export function CashflowChart() {
  const max = Math.max(...cashflow.flatMap((m) => [m.income, m.expenses]))

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Flujo de dinero</h2>
          <p className="text-sm text-muted-foreground">Ingresos vs. gastos · últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-chart-1" aria-hidden="true" />
            Ingresos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-chart-2" aria-hidden="true" />
            Gastos
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 sm:gap-5">
        {cashflow.map((m) => (
          <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end justify-center gap-1.5">
              <div
                className="w-full max-w-4 rounded-t-lg bg-chart-1 transition-all"
                style={{ height: `${(m.income / max) * 100}%` }}
                title={`Ingresos: ${formatMoney(m.income)}`}
              />
              <div
                className="w-full max-w-4 rounded-t-lg bg-chart-2 transition-all"
                style={{ height: `${(m.expenses / max) * 100}%` }}
                title={`Gastos: ${formatMoney(m.expenses)}`}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{m.month}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
