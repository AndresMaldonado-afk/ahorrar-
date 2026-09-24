'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, PiggyBank, Plus, Pencil, Trash2, Search, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Tags } from 'lucide-react'
import { FinanceProvider, useFinance } from '@/components/finance-provider'
import { DashboardNav } from '@/components/dashboard-nav'
import { NewMovementDialog } from '@/components/new-movement-dialog'
import { CategoryFormDialog } from '@/components/category-form-dialog'
import { DeleteCategoryDialog } from '@/components/delete-category-dialog'
import { formatMoney, type Category, type CategoryType } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 5

function PageLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <PiggyBank className="size-6" aria-hidden="true" />
      </span>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Cargando tus categorías…
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{message}</div>
  )
}

type FilterType = 'all' | CategoryType

function CategoriesContent() {
  const { categories, transactions, budgets, loading, error } = useFinance()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of budgets) map.set(b.category.id, b.spent)
    return map
  }, [budgets])

  const incomeByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      if (t.type !== 'income') continue
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
    }
    return map
  }, [transactions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return categories
      .filter((c) => (filter === 'all' ? true : c.type === filter))
      .filter((c) => (q ? c.name.toLowerCase().includes(q) : true))
  }, [categories, filter, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [query, filter])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setFormOpen(true)
  }

  const inputClass =
    'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'

  if (loading) return <PageLoading />

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="px-4 pb-16 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pt-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {error && <ErrorBanner message={error} />}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Tags className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance">Categorías</h1>
                <p className="text-sm text-muted-foreground text-pretty">
                  Crea, edita y organiza las categorías de tus ingresos y gastos.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 sm:self-start"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nueva categoría
            </button>
          </div>

          <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar categoría…"
                  aria-label="Buscar categoría"
                  className={cn(inputClass, 'pl-10')}
                />
              </div>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-muted p-1.5 sm:w-auto sm:shrink-0">
                {(
                  [
                    { key: 'all', label: 'Todas' },
                    { key: 'expense', label: 'Gastos' },
                    { key: 'income', label: 'Ingresos' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFilter(opt.key)}
                    aria-pressed={filter === opt.key}
                    className={cn(
                      'rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
                      filter === opt.key
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
                <span className="text-3xl" aria-hidden="true">
                  🔎
                </span>
                <p className="text-sm font-semibold text-foreground">No encontramos categorías</p>
                <p className="text-sm text-muted-foreground text-pretty">
                  {categories.length === 0
                    ? 'Todavía no tienes categorías. Crea la primera para empezar a organizar tus finanzas.'
                    : 'Prueba con otro nombre o cambia el filtro seleccionado.'}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {pageItems.map((category) => {
                  const isExpense = category.type === 'expense'
                  const spent = isExpense ? spentByCategory.get(category.id) ?? 0 : incomeByCategory.get(category.id) ?? 0
                  const hasLimit = isExpense && category.limit > 0
                  const over = hasLimit && spent > category.limit

                  return (
                    <li
                      key={category.id}
                      className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg"
                          style={{ backgroundColor: `color-mix(in oklch, ${category.color} 18%, transparent)` }}
                          aria-hidden="true"
                        >
                          {category.emoji}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{category.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                                isExpense ? 'bg-accent/12 text-accent' : 'bg-primary/12 text-primary',
                              )}
                            >
                              {isExpense ? (
                                <ArrowDownLeft className="size-3" aria-hidden="true" />
                              ) : (
                                <ArrowUpRight className="size-3" aria-hidden="true" />
                              )}
                              {isExpense ? 'Gasto' : 'Ingreso'}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {isExpense
                                ? hasLimit
                                  ? `${formatMoney(spent)} / ${formatMoney(category.limit)} al mes`
                                  : `${formatMoney(spent)} gastado · sin límite`
                                : `${formatMoney(spent)} recibido`}
                            </span>
                            {over && <span className="text-xs font-bold text-accent">Sobre el límite</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => openEdit(category)}
                          aria-label={`Editar ${category.name}`}
                          className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-muted"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(category)}
                          aria-label={`Eliminar ${category.name}`}
                          className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-accent/12 hover:text-accent"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {filtered.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Página {safePage} de {totalPages} · {filtered.length}{' '}
                  {filtered.length === 1 ? 'categoría' : 'categorías'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    aria-label="Página anterior"
                    className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors disabled:pointer-events-none disabled:opacity-40 hover:text-foreground"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    aria-label="Página siguiente"
                    className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors disabled:pointer-events-none disabled:opacity-40 hover:text-foreground"
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <NewMovementDialog />
      <CategoryFormDialog open={formOpen} onClose={() => setFormOpen(false)} category={editing} />
      <DeleteCategoryDialog category={deleting} onClose={() => setDeleting(null)} />
    </div>
  )
}

export default function CategoriasPage() {
  return (
    <FinanceProvider>
      <CategoriesContent />
    </FinanceProvider>
  )
}
