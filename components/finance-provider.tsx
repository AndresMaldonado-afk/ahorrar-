'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  categoryPalette,
  initialCategories,
  initialTransactions,
  openingBalance,
  signedAmount,
  type Category,
  type CategoryType,
  type Product,
  type Transaction,
} from '@/lib/finance-data'

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
  addCategory: (input: NewCategoryInput) => Category
  addTransaction: (input: NewTransactionInput) => void
  getCategory: (id: string) => Category | undefined
  newMovementOpen: boolean
  setNewMovementOpen: (open: boolean) => void
  manageCategoriesOpen: boolean
  setManageCategoriesOpen: (open: boolean) => void
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

const emojiPool = ['🍽️', '🚗', '🏥', '🎓', '🎁', '🐶', '👕', '📱', '💰', '🧾']

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [newMovementOpen, setNewMovementOpen] = useState(false)
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false)

  const addCategory = (input: NewCategoryInput) => {
    const paletteColor = categoryPalette[categories.length % categoryPalette.length]
    const category: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: input.name.trim(),
      type: input.type,
      limit: input.type === 'expense' ? Math.max(0, input.limit) : 0,
      emoji: input.emoji || emojiPool[categories.length % emojiPool.length],
      color: paletteColor,
    }
    setCategories((prev) => [...prev, category])
    return category
  }

  const addTransaction = (input: NewTransactionInput) => {
    const transaction: Transaction = {
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: input.type,
      title: input.title.trim() || 'Movimiento',
      categoryId: input.categoryId,
      amount: Math.max(0, input.amount),
      date: input.date,
      products: input.products && input.products.length > 0 ? input.products : undefined,
    }
    setTransactions((prev) => [transaction, ...prev])
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
    addCategory,
    addTransaction,
    getCategory,
    newMovementOpen,
    setNewMovementOpen,
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
