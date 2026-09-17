'use client'

import { useState } from 'react'
import { ChevronDown, Receipt } from 'lucide-react'
import { formatMoney, formatDate, signedAmount } from '@/lib/finance-data'
import { useFinance } from '@/components/finance-provider'
import { cn } from '@/lib/utils'

export function RecentTransactions() {
  const { transactions, getCategory, setNewMovementOpen } = useFinance()
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Movimientos recientes</h2>
          <p className="text-sm text-muted-foreground">Tu actividad de los últimos días</p>
        </div>
        <button
          type="button"
          onClick={() => setNewMovementOpen(true)}
          className="text-sm font-semibold text-primary hover:underline"
        >
          + Nuevo
        </button>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay movimientos. Registra el primero.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {transactions.slice(0, 8).map((t) => {
            const isIncome = t.type === 'income'
            const category = getCategory(t.categoryId)
            const hasProducts = !!t.products && t.products.length > 0
            const isOpen = expanded === t.id
            return (
              <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-lg"
                      aria-hidden="true"
                    >
                      {category?.emoji ?? (isIncome ? '💰' : '🧾')}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {category ? `${category.emoji} ${category.name}` : 'Sin categoría'} · {formatDate(t.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={isIncome ? 'text-sm font-bold text-primary' : 'text-sm font-bold text-accent'}>
                      {formatMoney(signedAmount(t), true)}
                    </span>
                    {hasProducts && (
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : t.id)}
                        className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={isOpen ? 'Ocultar productos' : 'Ver productos'}
                        aria-expanded={isOpen}
                      >
                        <ChevronDown className={cn('size-4 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {hasProducts && isOpen && (
                  <div className="mt-3 ml-13 flex flex-col gap-1.5 rounded-2xl bg-muted/50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Receipt className="size-3.5" aria-hidden="true" />
                      Detalle de productos
                    </p>
                    <ul className="flex flex-col gap-1">
                      {t.products!.map((p) => (
                        <li key={p.id} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{p.name}</span>
                          <span className="font-medium text-muted-foreground">{formatMoney(p.price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
