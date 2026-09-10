import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { summary, formatMoney } from '@/lib/finance-data'

const cards = [
  {
    label: 'Balance total',
    value: summary.balance,
    icon: Wallet,
    trend: '+8.2%',
    up: true,
    highlight: true,
  },
  {
    label: 'Ingresos del mes',
    value: summary.income,
    icon: TrendingUp,
    trend: '+4.9%',
    up: true,
    highlight: false,
  },
  {
    label: 'Gastos del mes',
    value: summary.expenses,
    icon: TrendingDown,
    trend: '-2.1%',
    up: false,
    highlight: false,
  },
  {
    label: 'Ahorrado',
    value: summary.saved,
    icon: PiggyBank,
    trend: `${summary.savingsRate}%`,
    up: true,
    highlight: false,
  },
]

export function BalanceCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const positiveTrend = card.up
        return (
          <div
            key={card.label}
            className={
              card.highlight
                ? 'flex flex-col gap-3 rounded-3xl bg-primary p-5 text-primary-foreground shadow-sm'
                : 'flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm'
            }
          >
            <div className="flex items-center justify-between">
              <span
                className={
                  card.highlight
                    ? 'flex size-9 items-center justify-center rounded-xl bg-primary-foreground/15'
                    : 'flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'
                }
              >
                <card.icon className="size-4.5" aria-hidden="true" />
              </span>
              <span
                className={
                  card.highlight
                    ? 'inline-flex items-center gap-0.5 rounded-full bg-primary-foreground/15 px-2 py-1 text-xs font-semibold'
                    : positiveTrend
                      ? 'inline-flex items-center gap-0.5 rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-primary'
                      : 'inline-flex items-center gap-0.5 rounded-full bg-accent/12 px-2 py-1 text-xs font-semibold text-accent'
                }
              >
                {positiveTrend ? (
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="size-3" aria-hidden="true" />
                )}
                {card.trend}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <p
                className={
                  card.highlight ? 'text-sm text-primary-foreground/80' : 'text-sm text-muted-foreground'
                }
              >
                {card.label}
              </p>
              <p className="font-display text-2xl font-extrabold tracking-tight">
                {formatMoney(card.value)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
