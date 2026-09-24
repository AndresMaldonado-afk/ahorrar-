'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Modal } from '@/components/modal'
import { useFinance } from '@/components/finance-provider'
import type { Category } from '@/lib/finance-data'

export function DeleteCategoryDialog({
  category,
  onClose,
}: {
  category: Category | null
  onClose: () => void
}) {
  const { deleteCategory, transactions } = useFinance()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const affected = category ? transactions.filter((t) => t.categoryId === category.id).length : 0

  async function handleDelete() {
    if (!category) return
    setSubmitting(true)
    try {
      await deleteCategory(category.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la categoría')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={Boolean(category)}
      onClose={onClose}
      title="Eliminar categoría"
      description="Esta acción no se puede deshacer."
    >
      {category && (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 rounded-2xl bg-accent/10 p-4">
            <AlertTriangle className="size-5 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground text-pretty">
              Vas a eliminar{' '}
              <span className="font-bold">
                {category.emoji} {category.name}
              </span>
              {affected > 0 ? (
                <>
                  {' '}
                  junto con {affected} {affected === 1 ? 'movimiento asociado' : 'movimientos asociados'}.
                </>
              ) : (
                '.'
              )}
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
