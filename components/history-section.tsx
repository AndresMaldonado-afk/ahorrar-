'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, PiggyBank } from 'lucide-react'
import { formatDate, formatMoney, lastMonthKeys, monthKeyOf, monthLabel, signedAmount } from '@/lib/finance-data'
import { useFinance } from '@/components/finance-provider'
import { cn } from '@/lib/utils'

type HistoryEntry = {
  id: string
  kind: 'income' | 'expense' | 'goal'
  title: string
  subtitle: string
  emoji: string
  amount: number
  date: string
}

const legend = [
  { label: 'Ingresos', className: 'bg-chart-1' },
  { label: 'Gastos', className: 'bg-chart-2' },
  { label: 'Ahorrado', className: 'bg-chart-3' },
]

export function HistorySection() {
  const { transactions, contributions, monthlyStats, monthKey, getCategory } = useFinance()
  const [selected, setSelected] = useState(monthKey)

  const monthOptions = useMemo(() => {
    const keys = new Set(lastMonthKeys(monthKey, 6))
    for (const t of transactions) keys.add(monthKeyOf(t.date))
    for (const c of contributions) keys.add(monthKeyOf(c.date))
    return [...keys].sort().reverse()
  }, [transactions, contributions, monthKey])

  const activeMonth = monthOptions.includes(selected) ? selected : monthKey

  const entries = useMemo<HistoryEntry[]>(() => {
    const fromTransactions = transactions
      .filter((t) => monthKeyOf(t.date) === activeMonth)
      .map<HistoryEntry>((t) => {
        const category = getCategory(t.categoryId)
        return {
          id: `t-${t.id}`,
          kind: t.type,
          title: t.title,
          subtitle: category ? `${category.emoji} ${category.name}` : 'Sin categoría',
          emoji: category?.emoji ?? (t.type === 'income' ? '💰' : '🧾'),
          amount: signedAmount(t),
          date: t.date,
        }
      })
    const fromGoals = contributions
      .filter((c) => monthKeyOf(c.date) === activeMonth)
      .map<HistoryEntry>((c) => ({
        id: `c-${c.id}`,
        kind: 'goal',
        title: c.title,
        subtitle: 'Metas de ahorro',
        emoji: '🎯',
        amount: c.amount,
        date: c.date,
      }))
    return [...fromTransactions, ...fromGoals].sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, contributions, activeMonth, getCategory])

  const max = Math.max(1, ...monthlyStats.flatMap((m) => [m.income, m.expenses, m.saved]))
  const activeStat = monthlyStats.find((m) => m.key === activeMonth)

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Historial</h2>
          <p className="text-sm text-muted-foreground">Ingresos, gastos y ahorro · últimos 6 meses</p>
        </div>
        <ul className="flex items-center gap-4 text-xs font-medium">
          {legend.map((item) => (
            <li key={item.label} className="inline-flex items-center gap-1.5">
              <span className={cn('size-2.5 rounded-full', item.className)} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-end justify-between gap-2 sm:gap-4">
        {monthlyStats.map((m) => {
          const isActive = m.key === activeMonth
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelected(m.key)}
              aria-pressed={isActive}
              aria-label={`${monthLabel(m.key)}: ingresos ${formatMoney(m.income)}, gastos ${formatMoney(m.expenses)}, ahorrado ${formatMoney(m.saved)}`}
              className={cn(
                'flex flex-1 flex-col items-center gap-2 rounded-2xl px-1 pb-2 pt-3 transition-colors',
                isActive ? 'bg-secondary' : 'hover:bg-muted/60',
              )}
            >
              <div className="flex h-40 w-full items-end justify-center gap-1">
                {[
                  { value: m.income, className: 'bg-chart-1', name: 'Ingresos' },
                  { value: m.expenses, className: 'bg-chart-2', name: 'Gastos' },
                  { value: m.saved, className: 'bg-chart-3', name: 'Ahorrado' },
                ].map((bar) => (
                  <div
                    key={bar.name}
                    className={cn('w-full max-w-3 rounded-t-md transition-all duration-500', bar.className)}
                    style={{ height: `${Math.max((bar.value / max) * 100, bar.value > 0 ? 3 : 0)}%` }}
                    title={`${bar.name}: ${formatMoney(bar.value)}`}
                  />
                ))}
              </div>
              <span className={cn('text-xs font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                {m.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="history-month" className="text-sm font-semibold">
            Mes a consultar
          </label>
          <div className="relative">
            <select
              id="history-month"
              value={activeMonth}
              onChange={(event) => setSelected(event.target.value)}
              className="h-10 appearance-none rounded-xl border border-border bg-background py-2 pl-3 pr-9 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {monthOptions.map((key) => (
                <option key={key} value={key}>
                  {monthLabel(key)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>

        {activeStat && (
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-secondary/60 p-2.5">
              <dt className="text-xs text-muted-foreground">Ingresos</dt>
              <dd className="text-sm font-bold text-primary">{formatMoney(activeStat.income)}</dd>
            </div>
            <div className="rounded-2xl bg-accent/10 p-2.5">
              <dt className="text-xs text-muted-foreground">Gastos</dt>
              <dd className="text-sm font-bold text-accent">{formatMoney(activeStat.expenses)}</dd>
            </div>
            <div className="rounded-2xl bg-muted p-2.5">
              <dt className="text-xs text-muted-foreground">Ahorrado</dt>
              <dd className="text-sm font-bold">{formatMoney(activeStat.saved)}</dd>
            </div>
          </dl>
        )}

        {entries.length === 0 ? (
          <p className="rounded-2xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
            No hay movimientos en {monthLabel(activeMonth)}.
          </p>
        ) : (
          <ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto pr-1">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-lg"
                    aria-hidden="true"
                  >
                    {entry.kind === 'goal' ? <PiggyBank className="size-5 text-chart-3" /> : entry.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.subtitle} · {formatDate(entry.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-sm font-bold',
                    entry.kind === 'income' && 'text-primary',
                    entry.kind === 'expense' && 'text-accent',
                    entry.kind === 'goal' && 'text-foreground',
                  )}
                >
                  {entry.kind === 'goal' ? `→ ${formatMoney(entry.amount, true)}` : formatMoney(entry.amount, true)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
