import { transactions, formatMoney } from '@/lib/finance-data'

export function RecentTransactions() {
  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Movimientos recientes</h2>
          <p className="text-sm text-muted-foreground">Tu actividad de los últimos días</p>
        </div>
        <a href="#" className="text-sm font-semibold text-primary hover:underline">
          Ver todo
        </a>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {transactions.map((t) => {
          const isIncome = t.amount > 0
          return (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-lg"
                  aria-hidden="true"
                >
                  {t.emoji}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category} · {t.date}
                  </p>
                </div>
              </div>
              <span
                className={
                  isIncome
                    ? 'text-sm font-bold text-primary'
                    : 'text-sm font-bold text-foreground'
                }
              >
                {formatMoney(t.amount, true)}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
