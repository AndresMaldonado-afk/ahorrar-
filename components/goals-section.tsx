'use client'

import { useState } from 'react'
import { AlertTriangle, Minus, Pencil, Plus } from 'lucide-react'
import { useFinance } from '@/components/finance-provider'
import { GoalFormDialog } from '@/components/goal-form-dialog'
import { GoalFundsDialog, type FundsMode } from '@/components/goal-funds-dialog'
import { formatGoalDeadline, formatMoney, type Goal } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

export function GoalsSection() {
  const { goals, savings, loading } = useFinance()
  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [fundsGoal, setFundsGoal] = useState<Goal | null>(null)
  const [fundsMode, setFundsMode] = useState<FundsMode>('deposit')

  function openCreate() {
    setEditingGoal(null)
    setFormOpen(true)
  }

  function openEdit(goal: Goal) {
    setEditingGoal(goal)
    setFormOpen(true)
  }

  function openFunds(goal: Goal, mode: FundsMode) {
    setFundsMode(mode)
    setFundsGoal(goal)
  }

  const freeAvailable = Math.max(0, savings.free)

  return (
    <section id="metas" className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Mis metas</h2>
          <p className="text-sm text-muted-foreground">Cada aporte te acerca un poco más</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          aria-label="Agregar meta"
        >
          <Plus className="size-4.5" aria-hidden="true" />
        </button>
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/60 p-3 text-center">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Ahorro total</dt>
          <dd className={cn('text-sm font-bold', savings.total < 0 && 'text-accent')}>
            {savings.total < 0 ? '-' : ''}
            {formatMoney(savings.total)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">En metas</dt>
          <dd className="text-sm font-bold">{formatMoney(savings.allocated)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Libre</dt>
          <dd className={cn('text-sm font-bold', savings.overfunded > 0 ? 'text-accent' : 'text-primary')}>
            {formatMoney(freeAvailable)}
          </dd>
        </div>
      </dl>

      {savings.overfunded > 0 && (
        <div className="flex gap-3 rounded-2xl bg-accent/12 p-3.5 text-accent" role="alert">
          <AlertTriangle className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold">Tus metas superan tu ahorro actual</p>
            <p className="text-xs leading-relaxed text-foreground/80 text-pretty">
              {`Tienes ${formatMoney(savings.allocated)} asignados pero tu ahorro total es de ${savings.total < 0 ? '-' : ''}${formatMoney(savings.total)}. Retira ${formatMoney(savings.overfunded)} de tus metas para cuadrar el fondo.`}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <ul className="flex flex-col gap-5" aria-busy="true">
          {[0, 1].map((i) => (
            <li key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </ul>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground text-pretty">
            Aún no tienes metas. Crea una y asígnale parte de tu ahorro libre.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" aria-hidden="true" />
            Crear meta
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100))
            return (
              <li key={goal.id} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-lg"
                      aria-hidden="true"
                    >
                      {goal.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{goal.name}</p>
                      <p className="text-xs text-muted-foreground">{formatGoalDeadline(goal.deadline)}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">{formatMoney(goal.saved)}</p>
                    <p className="text-xs text-muted-foreground">de {formatMoney(goal.target)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: goal.color }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-bold text-muted-foreground">{pct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openFunds(goal, 'deposit')}
                    disabled={freeAvailable <= 0}
                    className="inline-flex items-center gap-1 rounded-xl bg-primary/12 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Aportar
                  </button>
                  <button
                    type="button"
                    onClick={() => openFunds(goal, 'withdraw')}
                    disabled={goal.saved <= 0}
                    className="inline-flex items-center gap-1 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Minus className="size-3.5" aria-hidden="true" />
                    Retirar
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(goal)}
                    className="ml-auto flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Editar ${goal.name}`}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <GoalFormDialog open={formOpen} onClose={() => setFormOpen(false)} goal={editingGoal} />
      <GoalFundsDialog goal={fundsGoal} mode={fundsMode} onClose={() => setFundsGoal(null)} />
    </section>
  )
}
