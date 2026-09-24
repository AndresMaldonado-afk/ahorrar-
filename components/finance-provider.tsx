'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { categoryPalette, openingBalance, signedAmount, type Category, type CategoryType, type Product, type Transaction } from '@/lib/finance-data'

export type DerivedBudget = {
  category: Category
  spent: number
  limit: number
  color: string
}

type NewCategoryInput = {
  name: string
  type: CategoryType
  limit: number
  emoji?: string
}

type NewTransactionInput = {
  type: CategoryType
  title: string
  categoryId: string
  amount: number
  date: string
  products?: Product[]
}

type CurrentUser = {
  id: string
  email: string
  name: string
}

type FinanceContextValue = {
  categories: Category[]
  transactions: Transaction[]
  budgets: DerivedBudget[]
  summary: {
    balance: number
    income: number
    expenses: number
    saved: number
    savingsRate: number
    incomeCount: number
    expenseCount: number
  }
  user: CurrentUser | null
  loading: boolean
  error: string | null
  addCategory: (input: NewCategoryInput) => Promise<Category>
  updateCategory: (id: string, input: NewCategoryInput) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>
  addTransaction: (input: NewTransactionInput) => Promise<void>
  updateTransaction: (id: string, input: NewTransactionInput) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  getCategory: (id: string) => Category | undefined
  newMovementOpen: boolean
  setNewMovementOpen: (open: boolean) => void
  editingTransaction: Transaction | null
  setEditingTransaction: (transaction: Transaction | null) => void
  manageCategoriesOpen: boolean
  setManageCategoriesOpen: (open: boolean) => void
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

const emojiPool = ['🍽️', '🚗', '🏥', '🎓', '🎁', '🐶', '👕', '📱', '💰', '🧾']

type CategoryRow = {
  id: string
  name: string
  type: CategoryType
  monthly_limit: number
  emoji: string
  color: string
}

type TransactionRow = {
  id: string
  category_id: string
  type: CategoryType
  title: string
  amount: number
  date: string
  transaction_items: { id: string; name: string; price: number }[] | null
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    limit: Number(row.monthly_limit ?? 0),
    emoji: row.emoji,
    color: row.color,
  }
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    categoryId: row.category_id,
    amount: Number(row.amount ?? 0),
    date: row.date,
    products: row.transaction_items && row.transaction_items.length > 0
      ? row.transaction_items.map((p) => ({ id: p.id, name: p.name, price: Number(p.price ?? 0) }))
      : undefined,
  }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMovementOpen, setNewMovementOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) {
        if (active) setLoading(false)
        return
      }

      const currentUser: CurrentUser = {
        id: authData.user.id,
        email: authData.user.email ?? '',
        name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'ahorrador',
      }

      const [categoriesRes, transactionsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, type, monthly_limit, emoji, color')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('transactions')
          .select('id, category_id, type, title, amount, date, transaction_items(id, name, price)')
          .eq('user_id', currentUser.id)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
      ])

      if (!active) return

      if (categoriesRes.error || transactionsRes.error) {
        setError('No pudimos cargar tu información. Intenta de nuevo en un momento.')
        setLoading(false)
        return
      }

      setUser(currentUser)
      setCategories((categoriesRes.data ?? []).map(mapCategory))
      setTransactions((transactionsRes.data ?? []).map((row) => mapTransaction(row as unknown as TransactionRow)))
      setLoading(false)
    }

    load()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addCategory = async (input: NewCategoryInput) => {
    if (!user) throw new Error('No hay sesión activa')
    const paletteColor = categoryPalette[categories.length % categoryPalette.length]
    const emoji = input.emoji || emojiPool[categories.length % emojiPool.length]
    const monthlyLimit = input.type === 'expense' ? Math.max(0, input.limit) : 0

    const { data, error: insertError } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: input.name.trim(),
        type: input.type,
        monthly_limit: monthlyLimit,
        emoji,
        color: paletteColor,
      })
      .select('id, name, type, monthly_limit, emoji, color')
      .single()

    if (insertError || !data) {
      throw new Error('No se pudo crear la categoría. Intenta de nuevo.')
    }

    const category = mapCategory(data)
    setCategories((prev) => [...prev, category])
    return category
  }

  const updateCategory = async (id: string, input: NewCategoryInput) => {
    if (!user) throw new Error('No hay sesión activa')
    const monthlyLimit = input.type === 'expense' ? Math.max(0, input.limit) : 0
    const existing = categories.find((c) => c.id === id)

    const { data, error: updateError } = await supabase
      .from('categories')
      .update({
        name: input.name.trim(),
        type: input.type,
        monthly_limit: monthlyLimit,
        emoji: input.emoji || existing?.emoji,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name, type, monthly_limit, emoji, color')
      .single()

    if (updateError || !data) {
      throw new Error('No se pudo actualizar la categoría. Intenta de nuevo.')
    }

    const updated = mapCategory(data)
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }

  const deleteCategory = async (id: string) => {
    if (!user) throw new Error('No hay sesión activa')

    const { error: deleteError } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id)

    if (deleteError) {
      throw new Error('No se pudo eliminar la categoría. Intenta de nuevo.')
    }

    setCategories((prev) => prev.filter((c) => c.id !== id))
    setTransactions((prev) => prev.filter((t) => t.categoryId !== id))
  }

  const addTransaction = async (input: NewTransactionInput) => {
    if (!user) throw new Error('No hay sesión activa')

    const { data: transactionRow, error: insertError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        category_id: input.categoryId,
        type: input.type,
        title: input.title.trim() || 'Movimiento',
        amount: Math.max(0, input.amount),
        date: input.date,
      })
      .select('id, category_id, type, title, amount, date')
      .single()

    if (insertError || !transactionRow) {
      throw new Error('No se pudo guardar el movimiento. Intenta de nuevo.')
    }

    let items: { id: string; name: string; price: number }[] = []
    if (input.products && input.products.length > 0) {
      const { data: itemRows, error: itemsError } = await supabase
        .from('transaction_items')
        .insert(
          input.products.map((product) => ({
            transaction_id: transactionRow.id,
            name: product.name,
            price: Math.max(0, product.price),
          })),
        )
        .select('id, name, price')

      if (itemsError) {
        throw new Error('El movimiento se guardó, pero no se pudieron guardar los productos.')
      }
      items = itemRows ?? []
    }

    const transaction = mapTransaction({ ...transactionRow, transaction_items: items })
    setTransactions((prev) => [transaction, ...prev])
  }

  const updateTransaction = async (id: string, input: NewTransactionInput) => {
    if (!user) throw new Error('No hay sesión activa')

    const { data: transactionRow, error: updateError } = await supabase
      .from('transactions')
      .update({
        category_id: input.categoryId,
        type: input.type,
        title: input.title.trim() || 'Movimiento',
        amount: Math.max(0, input.amount),
        date: input.date,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, category_id, type, title, amount, date')
      .single()

    if (updateError || !transactionRow) {
      throw new Error('No se pudo actualizar el movimiento. Intenta de nuevo.')
    }

    const { error: clearItemsError } = await supabase.from('transaction_items').delete().eq('transaction_id', id)
    if (clearItemsError) {
      throw new Error('No se pudieron actualizar los productos del movimiento.')
    }

    let items: { id: string; name: string; price: number }[] = []
    if (input.products && input.products.length > 0) {
      const { data: itemRows, error: itemsError } = await supabase
        .from('transaction_items')
        .insert(
          input.products.map((product) => ({
            transaction_id: id,
            name: product.name,
            price: Math.max(0, product.price),
          })),
        )
        .select('id, name, price')

      if (itemsError) {
        throw new Error('El movimiento se actualizó, pero no se pudieron guardar los productos.')
      }
      items = itemRows ?? []
    }

    const transaction = mapTransaction({ ...transactionRow, transaction_items: items })
    setTransactions((prev) => prev.map((t) => (t.id === id ? transaction : t)))
  }

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error('No hay sesión activa')

    const { error: itemsError } = await supabase.from('transaction_items').delete().eq('transaction_id', id)
    if (itemsError) {
      throw new Error('No se pudo eliminar el movimiento. Intenta de nuevo.')
    }

    const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
    if (deleteError) {
      throw new Error('No se pudo eliminar el movimiento. Intenta de nuevo.')
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const getCategory = (id: string) => categories.find((c) => c.id === id)

  const budgets = useMemo<DerivedBudget[]>(() => {
    return categories
      .filter((c) => c.type === 'expense')
      .map((category) => {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.categoryId === category.id)
          .reduce((sum, t) => sum + t.amount, 0)
        return { category, spent, limit: category.limit, color: category.color }
      })
  }, [categories, transactions])

  const summary = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const saved = income - expenses
    const savingsRate = income > 0 ? Math.round((saved / income) * 100) : 0
    const balance = openingBalance + transactions.reduce((s, t) => s + signedAmount(t), 0)
    return {
      balance,
      income,
      expenses,
      saved,
      savingsRate,
      incomeCount: transactions.filter((t) => t.type === 'income').length,
      expenseCount: transactions.filter((t) => t.type === 'expense').length,
    }
  }, [transactions])

  const value: FinanceContextValue = {
    categories,
    transactions,
    budgets,
    summary,
    user,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getCategory,
    newMovementOpen,
    setNewMovementOpen,
    editingTransaction,
    setEditingTransaction,
    manageCategoriesOpen,
    setManageCategoriesOpen,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance debe usarse dentro de FinanceProvider')
  return ctx
}
