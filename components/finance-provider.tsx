'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  categoryPalette,
  currentMonthKey,
  autoPercentSum,
  distributeGoals,
  type DistributionMode,
  lastMonthKeys,
  localISO,
  monthKeyOf,
  monthShort,
  planGoalRebalance,
  roundMoney,
  type Category,
  type CategoryType,
  type Goal,
  type GoalContribution,
  type MonthlyStat,
  type Product,
  type Transaction,
} from '@/lib/finance-data'

export type GoalInput = {
  name: string
  emoji: string
  target: number
  deadline: string | null
  saved: number
  isAuto: boolean
  /** Share (0-100) of the unlocked savings; only used in "percent" distribution mode. */
  percentage?: number
}

type GoalRow = {
  id: string
  title: string
  emoji: string
  target_amount: number | string
  current_amount: number | string
  deadline: string | null
  is_auto: boolean
  manual_amount: number | string | null
  percentage: number | string | null
}

type GoalUpdate = {
  id: string
  current_amount?: number
  is_auto?: boolean
  manual_amount?: number | null
  percentage?: number
}

const goalColumns =
  'id, title, emoji, target_amount, current_amount, deadline, is_auto, manual_amount, percentage'

function mapGoal(row: GoalRow, index: number): Goal {
  const stored = Number(row.current_amount ?? 0)
  return {
    id: row.id,
    name: row.title,
    emoji: row.emoji,
    target: Number(row.target_amount ?? 0),
    saved: stored,
    storedSaved: stored,
    isAuto: row.is_auto ?? true,
    manualAmount: row.manual_amount == null ? null : Number(row.manual_amount),
    percentage: Number(row.percentage ?? 0),
    deadline: row.deadline,
    color: categoryPalette[index % categoryPalette.length],
  }
}

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
  /** Every transaction the user has ever saved (history is never deleted). */
  transactions: Transaction[]
  /** Only the transactions of the current month; drives the dashboard counters. */
  monthTransactions: Transaction[]
  /** Savings ledger: money moved into/out of goals, one row per change. */
  contributions: GoalContribution[]
  /** YYYY-MM of the month currently in progress. */
  monthKey: string
  /** Income, expenses and amount saved in goals for the last 6 months, oldest first. */
  monthlyStats: MonthlyStat[]
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
  goals: Goal[]
  savings: {
    total: number
    allocated: number
    free: number
    overfunded: number
    /** Savings not locked by manual goals (what auto goals share). */
    unlocked: number
  }
  autoDistribution: boolean
  setAutoDistribution: (enabled: boolean) => Promise<void>
  setGoalMode: (id: string, isAuto: boolean) => Promise<void>
  /** How auto goals share the unlocked savings: equally (1/N) or by custom percentages. */
  distributionMode: DistributionMode
  setDistributionMode: (mode: DistributionMode) => Promise<void>
  /** Saves the percentage of several goals at once (the auto goals must add up to 100% or less). */
  setGoalPercentages: (percentages: Record<string, number>) => Promise<void>
  maxDepositFor: (goal: Goal) => number
  addGoal: (input: GoalInput, options?: { rebalance?: boolean }) => Promise<void>
  updateGoal: (id: string, input: GoalInput, options?: { rebalance?: boolean }) => Promise<void>
  moveGoalFunds: (id: string, delta: number) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
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

type ContributionRow = {
  id: string
  goal_id: string | null
  title: string
  amount: number | string
  date: string
}

const contributionColumns = 'id, goal_id, title, amount, date'

function mapContribution(row: ContributionRow): GoalContribution {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    amount: Number(row.amount ?? 0),
    date: row.date,
  }
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
  const [goalRows, setGoalRows] = useState<GoalRow[]>([])
  const [distributionMode, setDistributionModeState] = useState<DistributionMode>('equal')
  const [contributions, setContributions] = useState<GoalContribution[]>([])
  const [monthKey, setMonthKey] = useState(currentMonthKey)
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

      const [categoriesRes, transactionsRes, goalsRes, contributionsRes, settingsRes] = await Promise.all([
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
        supabase
          .from('goals')
          .select(goalColumns)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('goal_contributions')
          .select(contributionColumns)
          .eq('user_id', currentUser.id)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('goal_settings').select('distribution_mode').eq('user_id', currentUser.id).maybeSingle(),
      ])

      if (!active) return

      if (categoriesRes.error || transactionsRes.error || goalsRes.error || contributionsRes.error) {
        setError('No pudimos cargar tu información. Intenta de nuevo en un momento.')
        setLoading(false)
        return
      }

      setUser(currentUser)
      setCategories((categoriesRes.data ?? []).map(mapCategory))
      setTransactions((transactionsRes.data ?? []).map((row) => mapTransaction(row as unknown as TransactionRow)))
      setGoalRows((goalsRes.data ?? []) as GoalRow[])
      setDistributionModeState(settingsRes.data?.distribution_mode === 'percent' ? 'percent' : 'equal')
      setContributions(((contributionsRes.data ?? []) as ContributionRow[]).map(mapContribution))
      setLoading(false)
    }

    load()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Month rollover: counters restart when the calendar month changes, history stays in Supabase.
  useEffect(() => {
    const id = window.setInterval(() => {
      setMonthKey((prev) => {
        const next = currentMonthKey()
        return next === prev ? prev : next
      })
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  const addCategory = async (input: NewCategoryInput) => {
    if (!user) throw new Error('No hay sesión activa')
    const paletteColor = categoryPalette[categories.length % categoryPalette.length]
    const emoji = input.emoji || emojiPool[categories.length % emojiPool.length]
    const monthlyLimit = Math.max(0, input.limit)

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
    const monthlyLimit = Math.max(0, input.limit)
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

  const monthTransactions = useMemo(
    () => transactions.filter((t) => monthKeyOf(t.date) === monthKey),
    [transactions, monthKey],
  )

  const budgets = useMemo<DerivedBudget[]>(() => {
    const totals = new Map<string, number>()
    for (const t of monthTransactions) {
      const category = categories.find((c) => c.id === t.categoryId)
      if (!category || category.type !== t.type) continue
      totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount)
    }
    return categories.map((category) => ({
      category,
      spent: totals.get(category.id) ?? 0,
      limit: category.limit,
      color: category.color,
    }))
  }, [categories, monthTransactions])

  const monthTotals = useMemo(() => {
    const incomeTx = monthTransactions.filter((t) => t.type === 'income')
    const expenseTx = monthTransactions.filter((t) => t.type === 'expense')
    const income = roundMoney(incomeTx.reduce((s, t) => s + t.amount, 0))
    const expenses = roundMoney(expenseTx.reduce((s, t) => s + t.amount, 0))
    return { income, expenses, incomeCount: incomeTx.length, expenseCount: expenseTx.length }
  }, [monthTransactions])

  const totalSavings = roundMoney(monthTotals.income - monthTotals.expenses)

  const { goals, manualSum } = useMemo(() => {
    const base = goalRows.map(mapGoal)
    const { amounts, manualSum } = distributeGoals(base, totalSavings, distributionMode)
    return {
      goals: base.map((g) => ({ ...g, saved: amounts.get(g.id) ?? g.storedSaved })),
      manualSum,
    }
  }, [goalRows, totalSavings, distributionMode])

  const savings = useMemo(() => {
    const allocated = roundMoney(goals.reduce((s, g) => s + g.saved, 0))
    const free = roundMoney(totalSavings - allocated)
    return {
      total: totalSavings,
      allocated,
      free,
      overfunded: free < 0 ? Math.abs(free) : 0,
      unlocked: roundMoney(totalSavings - manualSum),
    }
  }, [goals, manualSum, totalSavings])

  const autoDistribution = goals.length === 0 || goals.some((g) => g.isAuto)

  // Balance total = (month income - month expenses) - money assigned to goals.
  const summary = useMemo(() => {
    const { income, expenses } = monthTotals
    const saved = roundMoney(income - expenses)
    return {
      balance: roundMoney(saved - savings.allocated),
      income,
      expenses,
      saved,
      savingsRate: income > 0 ? Math.round((saved / income) * 100) : 0,
      incomeCount: monthTotals.incomeCount,
      expenseCount: monthTotals.expenseCount,
    }
  }, [monthTotals, savings.allocated])

  const monthlyStats = useMemo<MonthlyStat[]>(() => {
    return lastMonthKeys(monthKey, 6).map((key) => {
      let income = 0
      let expenses = 0
      for (const t of transactions) {
        if (monthKeyOf(t.date) !== key) continue
        if (t.type === 'income') income += t.amount
        else expenses += t.amount
      }
      const ledger = contributions
        .filter((c) => monthKeyOf(c.date) === key)
        .reduce((s, c) => s + c.amount, 0)
      return {
        key,
        label: monthShort(key),
        income: roundMoney(income),
        expenses: roundMoney(expenses),
        saved: key === monthKey ? Math.max(0, savings.allocated) : Math.max(0, roundMoney(ledger)),
      }
    })
  }, [transactions, contributions, monthKey, savings.allocated])

  // Keeps the ledger of the current month equal to what is assigned to goals right now,
  // so past months retain a snapshot of what was saved.
  const ledgerSyncing = useRef(false)
  const ledgerFailedSignature = useRef<string | null>(null)
  const monthLedgerSum = roundMoney(
    contributions.filter((c) => monthKeyOf(c.date) === monthKey).reduce((s, c) => s + c.amount, 0),
  )

  useEffect(() => {
    if (loading || !user || ledgerSyncing.current) return
    const delta = roundMoney(savings.allocated - monthLedgerSum)
    if (Math.abs(delta) < 0.01) {
      ledgerFailedSignature.current = null
      return
    }
    const signature = `${monthKey}:${delta}`
    if (ledgerFailedSignature.current === signature) return

    ledgerSyncing.current = true
    supabase
      .from('goal_contributions')
      .insert({
        user_id: user.id,
        title: delta > 0 ? 'Aporte a metas' : 'Retiro de metas',
        amount: delta,
        date: localISO(),
      })
      .select(contributionColumns)
      .single()
      .then(({ data, error: insertError }) => {
        ledgerSyncing.current = false
        if (insertError || !data) {
          ledgerFailedSignature.current = signature
          return
        }
        setContributions((prev) => [mapContribution(data as ContributionRow), ...prev])
      })
  }, [loading, user, supabase, monthKey, monthLedgerSum, savings.allocated])

  const persistGoalUpdates = async (updates: GoalUpdate[]) => {
    if (!user || updates.length === 0) return
    const results = await Promise.all(
      updates.map(({ id, ...fields }) =>
        supabase
          .from('goals')
          .update(fields)
          .eq('id', id)
          .eq('user_id', user.id)
          .select(goalColumns)
          .single(),
      ),
    )
    if (results.some((r) => r.error || !r.data)) {
      throw new Error('No se pudieron reajustar las demás metas. Intenta de nuevo.')
    }
    const updated = new Map(results.map((r) => [(r.data as GoalRow).id, r.data as GoalRow]))
    setGoalRows((prev) => prev.map((row) => updated.get(row.id) ?? row))
  }

  const resolveFunding = (goalId: string | null, input: GoalInput, rebalance?: boolean) => {
    if (!input.name.trim()) throw new Error('Escribe un nombre para la meta')
    if (!(input.target > 0)) throw new Error('El monto objetivo debe ser mayor a 0')
    if (input.saved < 0) throw new Error('El monto asignado no puede ser negativo')
    if (input.percentage !== undefined && (input.percentage < 0 || input.percentage > 100)) {
      throw new Error('El porcentaje debe estar entre 0 y 100')
    }
    if (input.isAuto) {
      if (distributionMode === 'percent') {
        const others = goals.filter((g) => g.id !== goalId)
        const total = autoPercentSum([...others, { isAuto: true, percentage: input.percentage ?? 0 }])
        if (total > 100.001) throw new Error(`Los porcentajes de tus metas suman ${total}%. No pueden superar 100%.`)
      }
      return []
    }

    const manualGoals = goals.filter((g) => !g.isAuto)
    const plan = planGoalRebalance({
      goals: manualGoals,
      goalId,
      newAmount: input.saved,
      freeSavings: savings.unlocked,
    })
    if (plan.kind === 'fits') return []
    if (plan.kind === 'impossible' || !rebalance) {
      throw new Error('No tienes suficiente ahorro para fijar ese monto.')
    }
    return plan.adjustments.map((a) => ({ id: a.id, current_amount: a.to, manual_amount: a.to }))
  }

  // manual_amount is only written while the goal is manual, so an auto goal never loses the amount the user fixed.
  const goalPayload = (input: GoalInput) => ({
    title: input.name.trim(),
    emoji: input.emoji || '🎯',
    target_amount: roundMoney(input.target),
    current_amount: input.isAuto ? 0 : roundMoney(input.saved),
    is_auto: input.isAuto,
    deadline: input.deadline || null,
    ...(input.isAuto ? {} : { manual_amount: roundMoney(input.saved) }),
    ...(input.percentage === undefined ? {} : { percentage: roundMoney(input.percentage) }),
  })

  // Turns auto goals back into manual ones, restoring the amount each user fixed before (or freezing the
  // current computed amount when there is none). If it no longer fits the savings, it is scaled down.
  const restoreManualAmounts = (targets: Goal[]): GoalUpdate[] => {
    const targetIds = new Set(targets.map((g) => g.id))
    const lockedSum = goals.filter((g) => !g.isAuto && !targetIds.has(g.id)).reduce((s, g) => s + g.storedSaved, 0)
    const available = Math.max(0, totalSavings - lockedSum)
    const desired = new Map(targets.map((g) => [g.id, g.manualAmount ?? g.saved]))
    const desiredSum = [...desired.values()].reduce((s, v) => s + v, 0)
    const scale = desiredSum > available && desiredSum > 0 ? available / desiredSum : 1
    return targets.map((g) => {
      const amount = Math.floor((desired.get(g.id) ?? 0) * scale * 100) / 100
      return { id: g.id, current_amount: amount, is_auto: false, manual_amount: g.manualAmount ?? amount }
    })
  }

  const toAutoUpdate = (goal: Goal): GoalUpdate => ({
    id: goal.id,
    current_amount: 0,
    is_auto: true,
    manual_amount: roundMoney(goal.storedSaved),
  })

  const setAutoDistribution = async (enabled: boolean) => {
    if (!user) throw new Error('No hay sesión activa')
    const updates = enabled
      ? goals.filter((g) => !g.isAuto).map(toAutoUpdate)
      : restoreManualAmounts(goals.filter((g) => g.isAuto))
    await persistGoalUpdates(updates)
  }

  const setGoalMode = async (id: string, isAuto: boolean) => {
    if (!user) throw new Error('No hay sesión activa')
    const goal = goals.find((g) => g.id === id)
    if (!goal || goal.isAuto === isAuto) return
    await persistGoalUpdates(isAuto ? [toAutoUpdate(goal)] : restoreManualAmounts([goal]))
  }

  const setDistributionMode = async (mode: DistributionMode) => {
    if (!user) throw new Error('No hay sesión activa')
    if (mode === distributionMode) return
    const { error: upsertError } = await supabase
      .from('goal_settings')
      .upsert({ user_id: user.id, distribution_mode: mode, updated_at: new Date().toISOString() })
    if (upsertError) throw new Error('No se pudo cambiar el modo de reparto. Intenta de nuevo.')
    setDistributionModeState(mode)
  }

  const setGoalPercentages = async (percentages: Record<string, number>) => {
    if (!user) throw new Error('No hay sesión activa')
    const next = goals.map((g) => ({
      ...g,
      percentage: percentages[g.id] === undefined ? g.percentage : roundMoney(percentages[g.id]),
    }))
    if (next.some((g) => g.percentage < 0 || g.percentage > 100)) {
      throw new Error('Cada porcentaje debe estar entre 0 y 100')
    }
    const total = autoPercentSum(next)
    if (total > 100.001) throw new Error(`Los porcentajes suman ${total}%. No pueden superar 100%.`)
    await persistGoalUpdates(
      next.filter((g) => percentages[g.id] !== undefined).map((g) => ({ id: g.id, percentage: g.percentage })),
    )
  }

  const addGoal = async (input: GoalInput, options?: { rebalance?: boolean }) => {
    if (!user) throw new Error('No hay sesión activa')
    const adjustments = resolveFunding(null, input, options?.rebalance)
    await persistGoalUpdates(adjustments)

    const { data, error: insertError } = await supabase
      .from('goals')
      .insert({ user_id: user.id, ...goalPayload(input) })
      .select(goalColumns)
      .single()

    if (insertError || !data) throw new Error('No se pudo crear la meta. Intenta de nuevo.')
    setGoalRows((prev) => [...prev, data as GoalRow])
  }

  const updateGoal = async (id: string, input: GoalInput, options?: { rebalance?: boolean }) => {
    if (!user) throw new Error('No hay sesión activa')
    const adjustments = resolveFunding(id, input, options?.rebalance)
    await persistGoalUpdates(adjustments)

    const { data, error: updateError } = await supabase
      .from('goals')
      .update(goalPayload(input))
      .eq('id', id)
      .eq('user_id', user.id)
      .select(goalColumns)
      .single()

    if (updateError || !data) throw new Error('No se pudo actualizar la meta. Intenta de nuevo.')
    setGoalRows((prev) => prev.map((row) => (row.id === id ? (data as GoalRow) : row)))
  }

  const moveGoalFunds = async (id: string, delta: number) => {
    if (!user) throw new Error('No hay sesión activa')
    const goal = goals.find((g) => g.id === id)
    if (!goal) throw new Error('No encontramos esa meta')
    const amount = roundMoney(delta)
    if (amount === 0) throw new Error('Escribe un monto mayor a 0')
    const depositCap = maxDepositFor(goal)
    if (amount > 0 && amount > depositCap + 0.001) {
      throw new Error(`Solo puedes aportar hasta ${depositCap.toFixed(2)} a esta meta.`)
    }
    if (amount < 0 && Math.abs(amount) > goal.saved + 0.001) {
      throw new Error('No puedes retirar más de lo que tiene la meta.')
    }
    const next = Math.max(0, roundMoney(goal.saved + amount))
    await persistGoalUpdates([{ id, current_amount: next, is_auto: false, manual_amount: next }])
  }

  const maxDepositFor = (goal: Goal) =>
    Math.max(0, roundMoney(savings.unlocked - (goal.isAuto ? goal.saved : 0)))

  const deleteGoal = async (id: string) => {
    if (!user) throw new Error('No hay sesión activa')
    const { error: deleteError } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id)
    if (deleteError) throw new Error('No se pudo eliminar la meta. Intenta de nuevo.')
    setGoalRows((prev) => prev.filter((row) => row.id !== id))
  }

  const value: FinanceContextValue = {
    categories,
    transactions,
    monthTransactions,
    contributions,
    monthKey,
    monthlyStats,
    budgets,
    summary,
    goals,
    savings,
    autoDistribution,
    setAutoDistribution,
    setGoalMode,
    distributionMode,
    setDistributionMode,
    setGoalPercentages,
    maxDepositFor,
    addGoal,
    updateGoal,
    moveGoalFunds,
    deleteGoal,
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
