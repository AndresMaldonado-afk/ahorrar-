export function formatMoney(value: number, withSign = false) {
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(Math.abs(value))
  if (!withSign) return formatted
  return `${value < 0 ? '-' : '+'}${formatted}`
}

export const summary = {
  balance: 48250,
  income: 32000,
  expenses: 19750,
  saved: 12250,
  savingsRate: 38,
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
  saved: number
  target: number
  deadline: string
  color: string
}

export const goals: Goal[] = [
  {
    id: 'viaje',
    name: 'Viaje a la playa',
    emoji: '🏝️',
    saved: 14500,
    target: 25000,
    deadline: 'Dic 2026',
    color: 'var(--chart-1)',
  },
  {
    id: 'emergencia',
    name: 'Fondo de emergencia',
    emoji: '🛟',
    saved: 32000,
    target: 60000,
    deadline: 'Jun 2027',
    color: 'var(--chart-3)',
  },
  {
    id: 'laptop',
    name: 'Laptop nueva',
    emoji: '💻',
    saved: 9800,
    target: 22000,
    deadline: 'Mar 2027',
    color: 'var(--chart-4)',
  },
]

export type Budget = {
  category: string
  spent: number
  limit: number
  color: string
}

export const budgets: Budget[] = [
  { category: 'Vivienda', spent: 7500, limit: 8000, color: 'var(--chart-1)' },
  { category: 'Comida', spent: 4200, limit: 5000, color: 'var(--chart-2)' },
  { category: 'Transporte', spent: 1800, limit: 2500, color: 'var(--chart-3)' },
  { category: 'Ocio', spent: 2600, limit: 2000, color: 'var(--chart-4)' },
  { category: 'Servicios', spent: 1650, limit: 2000, color: 'var(--chart-5)' },
]

export type Transaction = {
  id: string
  title: string
  category: string
  emoji: string
  amount: number
  date: string
}

export const transactions: Transaction[] = [
  { id: 't1', title: 'Nómina', category: 'Ingreso', emoji: '💼', amount: 32000, date: 'Hoy' },
  { id: 't2', title: 'Súper de la semana', category: 'Comida', emoji: '🛒', amount: -1240, date: 'Hoy' },
  { id: 't3', title: 'Suscripción música', category: 'Ocio', emoji: '🎧', amount: -129, date: 'Ayer' },
  { id: 't4', title: 'Aporte a metas', category: 'Ahorro', emoji: '🐷', amount: -2000, date: 'Ayer' },
  { id: 't5', title: 'Café con amigos', category: 'Ocio', emoji: '☕', amount: -180, date: '2 sep' },
  { id: 't6', title: 'Recibo de luz', category: 'Servicios', emoji: '💡', amount: -640, date: '1 sep' },
]
