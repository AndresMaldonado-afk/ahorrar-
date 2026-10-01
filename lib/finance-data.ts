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

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
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

export const cashflow = [
  { month: 'Abr', income: 28000, expenses: 21000 },
  { month: 'May', income: 30000, expenses: 22500 },
  { month: 'Jun', income: 29500, expenses: 20000 },
  { month: 'Jul', income: 31000, expenses: 19000 },
  { month: 'Ago', income: 30500, expenses: 21500 },
  { month: 'Sep', income: 32000, expenses: 19750 },
]

export type Goal = {
  id: string
  name: string
  emoji: string
  /** Money from the user's savings currently assigned to this goal. */
  saved: number
  target: number
  /** ISO date (YYYY-MM-DD) or null when the goal has no deadline. */
  deadline: string | null
  color: string
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
