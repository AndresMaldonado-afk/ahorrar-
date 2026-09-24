'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2, ListPlus, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Modal } from '@/components/modal'
import { useFinance } from '@/components/finance-provider'
import { categoryEmojiOptions, formatMoney, todayISO, type CategoryType, type Product } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

type Row = { id: string; name: string; price: string }

function newRow(): Row {
  return { id: `row-${Math.random().toString(36).slice(2, 8)}`, name: '', price: '' }
}

export function NewMovementDialog() {
  const {
    categories,
    addTransaction,
    updateTransaction,
    addCategory,
    newMovementOpen,
    setNewMovementOpen,
    editingTransaction,
    setEditingTransaction,
  } = useFinance()
  const isEdit = Boolean(editingTransaction)

  const [type, setType] = useState<CategoryType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [title, setTitle] = useState('')
  const [useProducts, setUseProducts] = useState(false)
  const [rows, setRows] = useState<Row[]>([newRow()])
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryLimit, setNewCategoryLimit] = useState('')
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!newMovementOpen) return
    if (editingTransaction) {
      setType(editingTransaction.type)
      setCategoryId(editingTransaction.categoryId)
      setDate(editingTransaction.date)
      setTitle(editingTransaction.title)
      if (editingTransaction.products && editingTransaction.products.length > 0) {
        setUseProducts(true)
        setRows(
          editingTransaction.products.map((p) => ({ id: p.id, name: p.name, price: String(p.price) })),
        )
        setAmount('')
      } else {
        setUseProducts(false)
        setRows([newRow()])
        setAmount(String(editingTransaction.amount))
      }
      setCreatingCategory(false)
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMovementOpen, editingTransaction])

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  )

  const productsTotal = useMemo(
    () => rows.reduce((sum, r) => sum + (Number.parseFloat(r.price) || 0), 0),
    [rows],
  )

  const effectiveAmount = useProducts ? productsTotal : Number.parseFloat(amount) || 0

  function reset() {
    setType('expense')
    setAmount('')
    setCategoryId('')
    setDate(todayISO())
    setTitle('')
    setUseProducts(false)
    setRows([newRow()])
    setCreatingCategory(false)
    setNewCategoryName('')
    setNewCategoryLimit('')
    setNewCategoryEmoji('')
    setError('')
  }

  function close() {
    setNewMovementOpen(false)
    setEditingTransaction(null)
    reset()
  }

  function handleTypeChange(next: CategoryType) {
    setType(next)
    setCategoryId('')
    setCreatingCategory(false)
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      setError('Escribe un nombre para la categoría')
      return
    }
    setSubmitting(true)
    try {
      const created = await addCategory({
        name: newCategoryName,
        type,
        limit: Number.parseFloat(newCategoryLimit) || 0,
        emoji: newCategoryEmoji || undefined,
      })
      setCategoryId(created.id)
      setCreatingCategory(false)
      setNewCategoryName('')
      setNewCategoryLimit('')
      setNewCategoryEmoji('')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la categoría')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId) {
      setError('Elige una categoría')
      return
    }
    if (effectiveAmount <= 0) {
      setError(useProducts ? 'Agrega al menos un producto con precio' : 'Ingresa un monto mayor a 0')
      return
    }
    let products: Product[] | undefined
    if (useProducts) {
      products = rows
        .filter((r) => r.name.trim() && Number.parseFloat(r.price) > 0)
        .map((r) => ({
          id: r.id,
          name: r.name.trim(),
          price: Number.parseFloat(r.price),
        }))
    }
    setSubmitting(true)
    try {
      const payload = { type, title, categoryId, amount: effectiveAmount, date, products }
      if (isEdit && editingTransaction) {
        await updateTransaction(editingTransaction.id, payload)
      } else {
        await addTransaction(payload)
      }
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el movimiento')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'
  const labelClass = 'text-sm font-semibold text-foreground'

  return (
    <Modal
      open={newMovementOpen}
      onClose={close}
      title={isEdit ? 'Editar movimiento' : 'Nuevo movimiento'}
      description={
        isEdit
          ? 'Actualiza los datos de este movimiento.'
          : 'Registra un ingreso o gasto y mantén tus finanzas al día.'
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
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
            onClick={() => handleTypeChange('income')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
              type === 'income' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            <ArrowUpRight className="size-4" aria-hidden="true" />
            Ingreso
          </button>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount" className={labelClass}>
            Monto total
          </label>
          <input
            id="amount"
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={useProducts ? String(productsTotal || '') : amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={useProducts}
            className={cn(inputClass, useProducts && 'cursor-not-allowed opacity-60')}
          />
          {useProducts && (
            <p className="text-xs text-muted-foreground">
              Se calcula automáticamente: {formatMoney(productsTotal)}
            </p>
          )}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className={labelClass}>
            Título
          </label>
          <input
            id="title"
            placeholder={type === 'income' ? 'Ej. Nómina de septiembre' : 'Ej. Súper de la semana'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className={labelClass}>
            Fecha
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className={labelClass}>
            Categoría
          </label>
          {!creatingCategory ? (
            <select
              id="category"
              value={categoryId}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setCreatingCategory(true)
                  setCategoryId('')
                } else {
                  setCategoryId(e.target.value)
                }
              }}
              className={inputClass}
            >
              <option value="">Selecciona una categoría</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
              <option value="__new__">+ Crear nueva categoría</option>
            </select>
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-3">
              <input
                autoFocus
                placeholder="Nombre de la categoría"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className={inputClass}
              />
              {type === 'expense' && (
                <input
                  inputMode="decimal"
                  type="number"
                  min="0"
                  placeholder="Límite mensual (opcional)"
                  value={newCategoryLimit}
                  onChange={(e) => setNewCategoryLimit(e.target.value)}
                  className={inputClass}
                />
              )}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground">Elige un emoji (opcional)</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {categoryEmojiOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setNewCategoryEmoji((prev) => (prev === option ? '' : option))}
                      aria-pressed={newCategoryEmoji === option}
                      aria-label={`Usar emoji ${option}`}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-xl text-base transition-colors',
                        newCategoryEmoji === option
                          ? 'bg-primary/15 ring-2 ring-primary'
                          : 'bg-background hover:bg-muted',
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="flex-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Guardar categoría
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingCategory(false)
                    setError('')
                  }}
                  className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product breakdown toggle */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <button
            type="button"
            onClick={() => setUseProducts((v) => !v)}
            className="flex items-center justify-between gap-3 text-left"
            aria-pressed={useProducts}
          >
            <span className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <ListPlus className="size-4.5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Agregar detalle de productos</span>
                <span className="block text-xs text-muted-foreground">Opcional · suma los precios por ti</span>
              </span>
            </span>
            <span
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                useProducts ? 'bg-primary' : 'bg-muted-foreground/30',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform',
                  useProducts ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </span>
          </button>

          {useProducts && (
            <div className="flex flex-col gap-2">
              {rows.map((row, index) => (
                <div key={row.id} className="flex items-center gap-2">
                  <input
                    placeholder={`Producto ${index + 1}`}
                    value={row.name}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))
                    }
                    className={cn(inputClass, 'flex-1')}
                  />
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="$"
                    value={row.price}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, price: e.target.value } : r)))
                    }
                    className={cn(inputClass, 'w-24')}
                  />
                  <button
                    type="button"
                    onClick={() => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== row.id) : prev))}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-accent"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRows((prev) => [...prev, newRow()])}
                className="mt-1 inline-flex items-center gap-1.5 self-start rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground"
              >
                <Plus className="size-4" aria-hidden="true" />
                Agregar producto
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-accent/12 px-3.5 py-2.5 text-sm font-medium text-accent" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="rounded-2xl bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-70"
          >
            {isEdit ? <Save className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar movimiento'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
