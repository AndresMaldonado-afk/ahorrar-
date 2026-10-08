export function formatMoney(value: number, withSign = false) {
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(Math.abs(value))
  if (!withSign) return formatted
  return `${value < 0 ? '-' : '+'}${formatted}`
}

export function formatDate(iso: string) {
  const date = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(date)
}

/** Local calendar date as YYYY-MM-DD (avoids the UTC shift of toISOString). */
export function localISO(date: Date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return localISO()
}

/** Month key in YYYY-MM format. */
export function currentMonthKey() {
  return localISO().slice(0, 7)
}

export function monthKeyOf(iso: string) {
  return iso.slice(0, 7)
}

/** The `count` month keys ending at `endKey`, oldest first. */
export function lastMonthKeys(endKey: string, count: number) {
  const [year, month] = endKey.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(year, month - 1 - (count - 1 - i), 1)
    return localISO(d).slice(0, 7)
  })
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "Octubre 2026" */
export function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number)
  const name = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date(year, month - 1, 1))
  return `${capitalize(name)} ${year}`
}

/** "Oct" */
export function monthShort(key: string) {
  const [year, month] = key.split('-').map(Number)
  const name = new Intl.DateTimeFormat('es-MX', { month: 'short' })
    .format(new Date(year, month - 1, 1))
    .replace('.', '')
  return capitalize(name)
}

/** One entry of the savings ledger: money moved into (+) or out of (-) goals. */
export type GoalContribution = {
  id: string
  goalId: string | null
  title: string
  amount: number
  date: string
}

export type MonthlyStat = {
  key: string
  label: string
  income: number
  expenses: number
  saved: number
}

/** Palette used when the user creates a new category. */
export const categoryPalette = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

/** Emoji choices offered when the user creates a new category. */
export const categoryEmojiOptions = [
  '🛒', '🏠', '🚌', '🎧', '💡', '🍽️', '🚗', '🏥', '🎓', '🎁',
  '🐶', '👕', '📱', '💼', '✨', '☕', '🎮', '📚', '✈️', '🎬',
  '🏋️', '🧴', '🐾', '🧾', '💰', '🛠️', '🎵', '🍎', '🚕', '🪙',
]

export type CategoryType = 'income' | 'expense'

export type Category = {
  id: string
  name: string
  type: CategoryType
  /** Estimated monthly budget. Only meaningful for expense categories. */
  limit: number
  emoji: string
  color: string
}

export type Product = {
  id: string
  name: string
  price: number
}

export type Transaction = {
  id: string
  type: CategoryType
  title: string
  categoryId: string
  /** Always a positive number. The sign is derived from `type`. */
  amount: number
  date: string
  products?: Product[]
}

/** Amount signed for balance math: income positive, expense negative. */
export function signedAmount(t: Transaction) {
  return t.type === 'income' ? t.amount : -t.amount
}

export const initialCategories: Category[] = [
  { id: 'sueldo', name: 'Sueldo', type: 'income', limit: 0, emoji: '💼', color: 'var(--chart-1)' },
  { id: 'extra', name: 'Ingresos extra', type: 'income', limit: 0, emoji: '✨', color: 'var(--chart-3)' },
  { id: 'vivienda', name: 'Vivienda', type: 'expense', limit: 8000, emoji: '🏠', color: 'var(--chart-1)' },
  { id: 'comida', name: 'Alimentación', type: 'expense', limit: 5000, emoji: '🛒', color: 'var(--chart-2)' },
  { id: 'transporte', name: 'Transporte', type: 'expense', limit: 2500, emoji: '🚌', color: 'var(--chart-3)' },
  { id: 'ocio', name: 'Ocio', type: 'expense', limit: 2000, emoji: '🎧', color: 'var(--chart-4)' },
  { id: 'servicios', name: 'Servicios', type: 'expense', limit: 2000, emoji: '💡', color: 'var(--chart-5)' },
]

export const initialTransactions: Transaction[] = [
  { id: 't1', type: 'income', title: 'Nómina', categoryId: 'sueldo', amount: 32000, date: todayISO() },
  {
    id: 't2',
    type: 'expense',
    title: 'Súper de la semana',
    categoryId: 'comida',
    amount: 1240,
    date: todayISO(),
    products: [
      { id: 'p1', name: 'Frutas y verduras', price: 420 },
      { id: 'p2', name: 'Carne y pollo', price: 510 },
      { id: 'p3', name: 'Despensa básica', price: 310 },
    ],
  },
  { id: 't3', type: 'expense', title: 'Suscripción música', categoryId: 'ocio', amount: 129, date: offsetISO(1) },
  { id: 't4', type: 'expense', title: 'Renta departamento', categoryId: 'vivienda', amount: 7500, date: offsetISO(2) },
  { id: 't5', type: 'expense', title: 'Café con amigos', categoryId: 'ocio', amount: 180, date: offsetISO(3) },
  { id: 't6', type: 'expense', title: 'Recibo de luz', categoryId: 'servicios', amount: 640, date: offsetISO(4) },
  { id: 't7', type: 'expense', title: 'Tarjeta de transporte', categoryId: 'transporte', amount: 800, date: offsetISO(5) },
]

function offsetISO(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export type Goal = {
  id: string
  name: string
  emoji: string
  /** Money from the user's savings currently assigned to this goal (computed for auto goals). */
  saved: number
  /** Amount persisted in the database; only meaningful for manual goals. */
  storedSaved: number
  /** Auto goals share the unlocked savings (equally or by percentage); manual goals keep their fixed amount. */
  isAuto: boolean
  /** Last amount the user fixed by hand; remembered while the goal is auto and restored when it goes back to manual. */
  manualAmount: number | null
  /** Share of the unlocked savings (0-100) used when the distribution mode is "percent". */
  percentage: number
  target: number
  /** ISO date (YYYY-MM-DD) or null when the goal has no deadline. */
  deadline: string | null
  color: string
}

export type DistributionMode = 'equal' | 'percent'

type DistributableGoal = Pick<Goal, 'id' | 'isAuto' | 'storedSaved' | 'target' | 'percentage'>

/** Sum of the percentages assigned to auto goals (manual goals are locked and do not take a share). */
export function autoPercentSum(goals: Pick<Goal, 'isAuto' | 'percentage'>[]) {
  return Math.round(goals.filter((g) => g.isAuto).reduce((s, g) => s + g.percentage, 0) * 100) / 100
}

/**
 * Manual goals keep their fixed amount. Whatever savings remain are shared among auto goals:
 * - "equal": split equally (1/N); a goal never receives more than its target and the excess flows to the rest.
 * - "percent": each goal gets its percentage of the remaining savings (capped at its target).
 *   If the percentages add up to more than 100 they are scaled down so nothing is over-allocated.
 */
export function distributeGoals(
  goals: DistributableGoal[],
  totalSavings: number,
  mode: DistributionMode = 'equal',
) {
  const amounts = new Map<string, number>()
  let manualSum = 0
  for (const goal of goals) {
    if (goal.isAuto) {
      amounts.set(goal.id, 0)
    } else {
      amounts.set(goal.id, goal.storedSaved)
      manualSum += goal.storedSaved
    }
  }

  let pool = Math.max(0, totalSavings - manualSum)

  if (mode === 'percent') {
    const sum = goals.filter((g) => g.isAuto).reduce((s, g) => s + g.percentage, 0)
    const scale = sum > 100 ? 100 / sum : 1
    for (const goal of goals) {
      if (!goal.isAuto) continue
      const share = (pool * goal.percentage * scale) / 100
      const amount = goal.target > 0 ? Math.min(goal.target, share) : 0
      amounts.set(goal.id, Math.floor(amount * 100) / 100)
    }
    return { amounts, manualSum: roundMoney(manualSum) }
  }

  let pending = goals.filter((g) => g.isAuto && g.target > 0)

  while (pending.length > 0 && pool > 0.004) {
    const share = pool / pending.length
    const capped = pending.filter((g) => g.target - (amounts.get(g.id) ?? 0) <= share)
    if (capped.length === 0) {
      for (const goal of pending) amounts.set(goal.id, (amounts.get(goal.id) ?? 0) + share)
      pool = 0
      break
    }
    for (const goal of capped) {
      pool -= goal.target - (amounts.get(goal.id) ?? 0)
      amounts.set(goal.id, goal.target)
    }
    pending = pending.filter((g) => !capped.includes(g))
  }

  for (const goal of goals) {
    if (goal.isAuto) amounts.set(goal.id, Math.floor((amounts.get(goal.id) ?? 0) * 100) / 100)
  }
  return { amounts, manualSum: roundMoney(manualSum) }
}

export const goalEmojiOptions = [
  '🎯', '🏝️', '🛟', '💻', '🚗', '🏠', '✈️', '🎓', '💍', '🎁',
  '📱', '🎮', '🏋️', '🐶', '👶', '🛋️', '🎸', '📷', '🚲', '💰',
]

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function formatGoalDeadline(iso: string | null) {
  if (!iso) return 'Sin fecha límite'
  const date = new Date(iso + 'T00:00:00')
  const label = new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' }).format(date).replace('.', '')
  return `Meta para ${label.charAt(0).toUpperCase()}${label.slice(1)}`
}

export type GoalRebalancePlan =
  | { kind: 'fits' }
  | { kind: 'rebalance'; shortfall: number; adjustments: { id: string; from: number; to: number }[] }
  | { kind: 'impossible'; shortfall: number; maxAssignable: number }

/**
 * Decides how to fund `newAmount` for a goal. If the free savings cover the increase it fits;
 * otherwise the missing money is taken proportionally from the other goals.
 */
export function planGoalRebalance({
  goals,
  goalId,
  newAmount,
  freeSavings,
}: {
  goals: Goal[]
  goalId: string | null
  newAmount: number
  freeSavings: number
}): GoalRebalancePlan {
  const current = goals.find((g) => g.id === goalId)?.saved ?? 0
  const available = Math.max(0, freeSavings)
  const increase = roundMoney(newAmount - current)
  if (increase <= available + 0.001) return { kind: 'fits' }

  const shortfall = roundMoney(increase - available)
  const others = goals.filter((g) => g.id !== goalId && g.saved > 0)
  const othersTotal = roundMoney(others.reduce((s, g) => s + g.saved, 0))

  if (othersTotal + 0.001 < shortfall) {
    return { kind: 'impossible', shortfall, maxAssignable: roundMoney(current + available + othersTotal) }
  }

  const ratio = 1 - shortfall / othersTotal
  const adjustments = others.map((g) => ({ id: g.id, from: g.saved, to: roundMoney(g.saved * ratio) }))
  const taken = roundMoney(adjustments.reduce((s, a) => s + (a.from - a.to), 0))
  const drift = roundMoney(shortfall - taken)
  if (drift !== 0 && adjustments.length > 0) {
    const largest = adjustments.reduce((a, b) => (b.to > a.to ? b : a))
    largest.to = Math.max(0, roundMoney(largest.to - drift))
  }
  return { kind: 'rebalance', shortfall, adjustments }
}

/** Starting balance so the header balance reflects savings on top of it. */
export const openingBalance = 28500
