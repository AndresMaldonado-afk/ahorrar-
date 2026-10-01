'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Modal } from '@/components/modal'
import { useFinance } from '@/components/finance-provider'
import { formatMoney, type Transaction } from '@/lib/finance-data'

export function DeleteTransactionDialog({
  transaction,
  onClose,
}: {
  transaction: Transaction | null
  onClose: () => void
}) {
  const { deleteTransaction, getCategory } = useFinance()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const category = transaction ? getCategory(transaction.categoryId) : undefined

  async function handleDelete() {
    if (!transaction) return
    setSubmitting(true)
    try {
      await deleteTransaction(transaction.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el movimiento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={Boolean(transaction)}
      onClose={onClose}
      title="Eliminar movimiento"
      description="Esta acción no se puede deshacer."
    >
      {transaction && (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 rounded-2xl bg-accent/10 p-4">
            <AlertTriangle className="size-5 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground text-pretty">
              Vas a eliminar{' '}
              <span className="font-bold">
                {category ? `${category.emoji} ` : ''}
                {transaction.title}
              </span>{' '}
              por {formatMoney(transaction.amount)}.
            </p>
          </div>

          {error && (
            <p className="rounded-xl bg-accent/12 px-3.5 py-2.5 text-sm font-medium text-accent" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-sm disabled:pointer-events-none disabled:opacity-70"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {submitting ? 'Eliminando…' : 'Eliminar definitivamente'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
