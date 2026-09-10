import { Plus } from 'lucide-react'
import { goals, formatMoney } from '@/lib/finance-data'

export function GoalsSection() {
  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Mis metas</h2>
          <p className="text-sm text-muted-foreground">Cada aporte te acerca un poco más</p>
        </div>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          aria-label="Agregar meta"
        >
          <Plus className="size-4.5" aria-hidden="true" />
        </button>
      </div>

      <ul className="flex flex-col gap-5">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100))
          return (
            <li key={goal.id} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-lg"
                    aria-hidden="true"
                  >
                    {goal.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">Meta para {goal.deadline}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatMoney(goal.saved)}</p>
                  <p className="text-xs text-muted-foreground">de {formatMoney(goal.target)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: goal.color }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-bold text-muted-foreground">{pct}%</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
