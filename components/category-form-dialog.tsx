'use client'

import { useEffect, useState } from 'react'
import { Plus, Save, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Modal } from '@/components/modal'
import { useFinance } from '@/components/finance-provider'
import { categoryEmojiOptions, type Category, type CategoryType } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

export function CategoryFormDialog({
  open,
  onClose,
  category,
}: {
  open: boolean
  onClose: () => void
  category: Category | null
}) {
  const { addCategory, updateCategory } = useFinance()
  const isEdit = Boolean(category)

  const [type, setType] = useState<CategoryType>('expense')
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [emoji, setEmoji] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setType(category?.type ?? 'expense')
    setName(category?.name ?? '')
    setLimit(category?.limit ? String(category.limit) : '')
    setEmoji(category?.emoji ?? '')
    setError('')
  }, [open, category])

  const inputClass =
    'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'
  const labelClass = 'text-sm font-semibold text-foreground'

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Escribe un nombre para la categoría')
      return
    }
    setSubmitting(true)
    try {
      const payload = { name, type, limit: Number.parseFloat(limit) || 0, emoji }
      if (isEdit && category) {
        await updateCategory(category.id, payload)
      } else {
        await addCategory(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la categoría')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
      description={
        isEdit
          ? 'Actualiza el nombre, tipo, límite o emoji de esta categoría.'
          : 'Crea una categoría para organizar tus ingresos y gastos.'
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
              type === 'expense' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            <ArrowDownLeft className="size-4" aria-hidden="true" />
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
              type === 'income' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            <ArrowUpRight className="size-4" aria-hidden="true" />
            Ingreso
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cat-name" className={labelClass}>
            Nombre
          </label>
          <input
            id="cat-name"
            autoFocus
            placeholder="Ej. Alimentación"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        {type === 'expense' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cat-limit" className={labelClass}>
              Límite mensual
            </label>
            <input
              id="cat-limit"
              inputMode="decimal"
              type="number"
              min="0"
              placeholder="Opcional"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground">Elige un emoji</p>
          <div className="grid grid-cols-6 gap-1.5">
            {categoryEmojiOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEmoji((prev) => (prev === option ? '' : option))}
                aria-pressed={emoji === option}
                aria-label={`Usar emoji ${option}`}
                className={cn(
                  'flex size-9 items-center justify-center rounded-xl text-base transition-colors',
                  emoji === option ? 'bg-primary/15 ring-2 ring-primary' : 'bg-background hover:bg-muted',
                )}
              >
                {option}
              </button>
            ))}
          </div>
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
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-70"
          >
            {isEdit ? <Save className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
