'use client'

import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatMoney } from '@/lib/finance-data'
import { useFinance } from '@/components/finance-provider'

export function BalanceCards() {
  const { summary } = useFinance()

  const cards = [
    {
      label: 'Balance total',
      value: summary.balance,
      icon: Wallet,
      trend: `${summary.savingsRate}% ahorro`,
      up: summary.balance >= 0,
      highlight: true,
    },
    {
      label: 'Ingresos del mes',
      value: summary.income,
      icon: TrendingUp,
      trend: `${summary.incomeCount} mov`,
      up: true,
      highlight: false,
    },
    {
      label: 'Gastos del mes',
      value: summary.expenses,
      icon: TrendingDown,
      trend: `${summary.expenseCount} mov`,
      up: false,
      highlight: false,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((card, index) => {
          const positiveTrend = card.up
          return (
            <div
              key={card.label}
              className={[
                card.highlight
                  ? 'flex flex-col gap-3 rounded-3xl bg-primary p-5 text-primary-foreground shadow-sm'
                  : 'flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm',
                index === 0 ? 'col-span-2 lg:col-span-1' : '',
              ].join(' ')}
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
      <SavedCard />
    </div>
  )
}

function SavedCard() {
  const { savings } = useFinance()

  const fund = Math.max(savings.total, 0)
  const inGoals = Math.min(Math.max(savings.allocated, 0), fund)
  const available = fund - inGoals
  const goalsPct = fund > 0 ? Math.round((inGoals / fund) * 100) : 0
  const availablePct = 100 - goalsPct

  return (
    <section
      aria-label="Ahorrado"
      className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <PiggyBank className="size-4.5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-muted-foreground">Ahorrado</p>
            <p className="font-display text-2xl font-extrabold tracking-tight">
              {formatMoney(fund)}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
          100%
        </span>
      </div>

      <div
        role="img"
        aria-label={`${availablePct}% disponible y ${goalsPct}% destinado a metas`}
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full bg-primary transition-[width] duration-500"
          style={{ width: `${availablePct}%` }}
        />
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${goalsPct}%` }}
        />
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-2xl bg-secondary/60 p-3">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
            Disponible / Libre
          </dt>
          <dd className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-display text-lg font-bold">{formatMoney(available)}</span>
            <span className="text-sm font-semibold text-primary">+ {availablePct}% Disponible</span>
          </dd>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl bg-accent/10 p-3">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2.5 rounded-full bg-accent" aria-hidden="true" />
            Destinado a Metas
          </dt>
          <dd className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-display text-lg font-bold">{formatMoney(inGoals)}</span>
            <span className="text-sm font-semibold text-accent">- {goalsPct}% En Metas</span>
          </dd>
        </div>
      </dl>
    </section>
  )
}
