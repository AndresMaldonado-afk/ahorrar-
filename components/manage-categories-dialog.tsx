'use client'

import { useState } from 'react'
import { Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Modal } from '@/components/modal'
import { useFinance } from '@/components/finance-provider'
import { categoryEmojiOptions, formatMoney, type CategoryType } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

export function ManageCategoriesDialog() {
  const { categories, addCategory, manageCategoriesOpen, setManageCategoriesOpen } = useFinance()

  const [type, setType] = useState<CategoryType>('expense')
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [emoji, setEmoji] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const inputClass =
    'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'

  async function handleAdd() {
    if (!name.trim()) {
      setError('Escribe un nombre para la categoría')
      return
    }
    setSubmitting(true)
    try {
      await addCategory({ name, type, limit: Number.parseFloat(limit) || 0, emoji: emoji || undefined })
      setName('')
      setLimit('')
      setEmoji('')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la categoría')
    } finally {
      setSubmitting(false)
    }
  }

  const income = categories.filter((c) => c.type === 'income')
  const expense = categories.filter((c) => c.type === 'expense')

  return (
    <Modal
      open={manageCategoriesOpen}
      onClose={() => setManageCategoriesOpen(false)}
      title="Categorías"
      description="Organiza tus ingresos y gastos con tus propias categorías."
    >
      <div className="flex flex-col gap-6">
        {/* Create */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-sm font-semibold">Crear categoría</p>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
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
                'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                type === 'income' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              <ArrowUpRight className="size-4" aria-hidden="true" />
              Ingreso
            </button>
          </div>
          <input
            placeholder="Nombre (ej. Alimentación)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          {type === 'expense' && (
            <input
              inputMode="decimal"
              type="number"
              min="0"
              placeholder="Límite de presupuesto mensual"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className={inputClass}
            />
          )}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Elige un emoji (opcional)</p>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
              {categoryEmojiOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setEmoji((prev) => (prev === option ? '' : option))}
                  aria-pressed={emoji === option}
                  aria-label={`Usar emoji ${option}`}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-xl text-base transition-colors',
                    emoji === option
                      ? 'bg-primary/15 ring-2 ring-primary'
                      : 'bg-background hover:bg-muted',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-sm font-medium text-accent" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-70"
          >
            <Plus className="size-4" aria-hidden="true" />
            {submitting ? 'Guardando…' : 'Agregar categoría'}
          </button>
        </div>

        {/* Lists */}
        <div className="flex flex-col gap-4">
          <CategoryGroup title="Gastos" items={expense} showLimit />
          <CategoryGroup title="Ingresos" items={income} />
        </div>
      </div>
    </Modal>
  )
}

function CategoryGroup({
  title,
  items,
  showLimit = false,
}: {
  title: string
  items: ReturnType<typeof useFinance>['categories']
  showLimit?: boolean
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="flex flex-col gap-2">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <span
                className="flex size-9 items-center justify-center rounded-xl text-base"
                style={{ backgroundColor: `color-mix(in oklch, ${c.color} 18%, transparent)` }}
                aria-hidden="true"
              >
                {c.emoji}
              </span>
              <span className="text-sm font-semibold">{c.name}</span>
            </span>
            {showLimit && (
              <span className="text-xs font-semibold text-muted-foreground">
                {c.limit > 0 ? `${formatMoney(c.limit)}/mes` : 'Sin límite'}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
