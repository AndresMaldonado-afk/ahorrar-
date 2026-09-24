'use client'

import { Plus } from 'lucide-react'
import { useFinance } from '@/components/finance-provider'

const monthLabel = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(new Date())

export function GreetingHeader() {
  const { setNewMovementOpen, user } = useFinance()
  const firstName = user?.name ? user.name.split(' ')[0] : 'ahorrador'
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium capitalize text-muted-foreground">{monthLabel}</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          ¡Hola, {displayName}! 👋
        </h1>
        <p className="max-w-md text-pretty text-sm text-muted-foreground">
          Vas por buen camino este mes. Sigue así y alcanzarás tus metas antes de lo previsto.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setNewMovementOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
      >
        <Plus className="size-4" aria-hidden="true" />
        Nuevo movimiento
      </button>
    </div>
  )
}
