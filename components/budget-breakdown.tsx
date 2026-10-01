'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from 'lucide-react'
import { formatMoney, type CategoryType } from '@/lib/finance-data'
import { useFinance, type DerivedBudget } from '@/components/finance-provider'
import { cn } from '@/lib/utils'

const tabs: { value: CategoryType; label: string; icon: typeof ArrowDownLeft }[] = [
  { value: 'expense', label: 'Gastos', icon: ArrowDownLeft },
  { value: 'income', label: 'Ingresos', icon: ArrowUpRight },
]

export function BudgetBreakdown() {
  const { budgets, setManageCategoriesOpen } = useFinance()
  const [tab, setTab] = useState<CategoryType>('expense')

  const visible = budgets.filter((b) => b.category.type === tab)
  const isExpense = tab === 'expense'

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Presupuesto por categoría</h2>
          <p className="text-sm text-muted-foreground">
            {isExpense ? 'Cómo se reparte tu gasto frente a tus límites' : 'Cuánto llevas recibido frente a tus metas'}
          </p>
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

      <div role="tablist" aria-label="Tipo de categoría" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-muted p-1.5">
        {tabs.map(({ value, label, icon: Icon }) => {
          const selected = tab === value
          const count = budgets.filter((b) => b.category.type === value).length
          return (
            <button
              key={value}
              type="button"
              role="tab"
              id={`budget-tab-${value}`}
              aria-selected={selected}
              aria-controls="budget-panel"
              onClick={() => setTab(value)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                selected
                  ? value === 'expense'
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
              <span className={cn('text-xs', selected ? 'opacity-80' : 'opacity-60')}>{count}</span>
            </button>
          )
        })}
      </div>

      <div id="budget-panel" role="tabpanel" aria-labelledby={`budget-tab-${tab}`}>
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isExpense
              ? 'Aún no tienes categorías de gasto. Crea una para empezar.'
              : 'Aún no tienes categorías de ingreso. Crea una para empezar.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {visible.map((b) => (isExpense ? <ExpenseRow key={b.category.id} b={b} /> : <IncomeRow key={b.category.id} b={b} />))}
          </ul>
        )}
      </div>
    </section>
  )
}

function RowHeader({ b, amountClass, suffix }: { b: DerivedBudget; amountClass: string; suffix: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex min-w-0 items-center gap-2 font-semibold">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.color }} aria-hidden="true" />
        <span className="truncate">
          {b.category.emoji} {b.category.name}
        </span>
      </span>
      <span className="shrink-0 text-muted-foreground">
        <span className={cn('font-bold', amountClass)}>{formatMoney(b.spent)}</span>
        {suffix}
      </span>
    </div>
  )
}

function ProgressBar({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <div
      className="h-2.5 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function ExpenseRow({ b }: { b: DerivedBudget }) {
  const hasLimit = b.limit > 0
  const pct = hasLimit ? Math.min(100, Math.round((b.spent / b.limit) * 100)) : b.spent > 0 ? 100 : 0
  const over = hasLimit && b.spent > b.limit
  return (
    <li className="flex flex-col gap-2">
      <RowHeader
        b={b}
        amountClass={over ? 'text-accent' : 'text-foreground'}
        suffix={hasLimit ? <> {' / '}{formatMoney(b.limit)}</> : <span className="text-xs"> · sin límite</span>}
      />
      <ProgressBar pct={pct} color={over ? 'var(--accent)' : b.color} label={`Gasto en ${b.category.name}`} />
      {over && (
        <p className="text-xs font-medium text-accent">Te pasaste {formatMoney(b.spent - b.limit)} del límite</p>
      )}
    </li>
  )
}

function IncomeRow({ b }: { b: DerivedBudget }) {
  const hasGoal = b.limit > 0
  const pct = hasGoal ? Math.min(100, Math.round((b.spent / b.limit) * 100)) : b.spent > 0 ? 100 : 0
  const reached = hasGoal && b.spent >= b.limit
  return (
    <li className="flex flex-col gap-2">
      <RowHeader
        b={b}
        amountClass="text-primary"
        suffix={hasGoal ? <> {' / '}{formatMoney(b.limit)}</> : <span className="text-xs"> · sin meta</span>}
      />
      <ProgressBar pct={pct} color="var(--primary)" label={`Ingreso en ${b.category.name}`} />
      {hasGoal && (
        <p className="text-xs font-medium text-primary">
          {reached
            ? b.spent > b.limit
              ? `Superaste tu meta por ${formatMoney(b.spent - b.limit)}`
              : 'Meta alcanzada'
            : `${pct}% de la meta · faltan ${formatMoney(b.limit - b.spent)}`}
        </p>
      )}
    </li>
  )
}
