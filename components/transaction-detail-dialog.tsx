'use client'

import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-react'
import { Modal } from '@/components/modal'
import { useFinance } from '@/components/finance-provider'
import { formatDate, formatMoney, type Transaction } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

export function TransactionDetailDialog({
  transaction,
  onClose,
  onEdit,
  onDelete,
}: {
  transaction: Transaction | null
  onClose: () => void
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}) {
  const { getCategory } = useFinance()
  const category = transaction ? getCategory(transaction.categoryId) : undefined
  const isExpense = transaction?.type === 'expense'

  return (
    <Modal
      open={Boolean(transaction)}
      onClose={onClose}
      title="Detalle del movimiento"
      description="Revisa la información completa de este movimiento."
    >
      {transaction && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl"
              style={{
                backgroundColor: category
                  ? `color-mix(in oklch, ${category.color} 18%, transparent)`
                  : 'var(--muted)',
              }}
              aria-hidden="true"
            >
              {category?.emoji ?? '💸'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-foreground">{transaction.title}</p>
              <p className="text-sm text-muted-foreground">{category?.name ?? 'Sin categoría'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground">Monto</p>
              <p
                className={cn(
                  'mt-1 flex items-center gap-1 text-lg font-bold',
                  isExpense ? 'text-accent' : 'text-primary',
                )}
              >
                {isExpense ? (
                  <ArrowDownLeft className="size-4" aria-hidden="true" />
                ) : (
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                )}
                {formatMoney(transaction.amount)}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground">Fecha</p>
              <p className="mt-1 text-lg font-bold text-foreground">{formatDate(transaction.date)}</p>
            </div>
          </div>

          {transaction.products && transaction.products.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground">Detalle de productos</p>
              <ul className="flex flex-col gap-1.5 rounded-2xl border border-border p-3">
                {transaction.products.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-foreground">{product.name}</span>
                    <span className="shrink-0 font-semibold text-muted-foreground">
                      {formatMoney(product.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onDelete(transaction)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/12 hover:text-accent"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Eliminar
            </button>
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
