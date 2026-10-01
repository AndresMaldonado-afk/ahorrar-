'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Modal } from '@/components/modal'
import { useFinance } from '@/components/finance-provider'
import { formatMoney, roundMoney, type Goal } from '@/lib/finance-data'

export type FundsMode = 'deposit' | 'withdraw'

export function GoalFundsDialog({
  goal,
  mode,
  onClose,
}: {
  goal: Goal | null
  mode: FundsMode
  onClose: () => void
}) {
  const { maxDepositFor, moveGoalFunds } = useFinance()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setAmount('')
    setError('')
  }, [goal, mode])

  const isDeposit = mode === 'deposit'
  const max = goal ? (isDeposit ? maxDepositFor(goal) : goal.saved) : 0
  const value = roundMoney(Number.parseFloat(amount) || 0)
  const exceeds = value > max + 0.001

  async function handleSubmit() {
    if (!goal) return
    if (value <= 0) return setError('Escribe un monto mayor a 0')
    if (exceeds) {
      return setError(
        isDeposit
          ? `Solo puedes aportar hasta ${formatMoney(max)} a esta meta.`
          : `Esta meta solo tiene ${formatMoney(max)} asignados.`,
      )
    }
    setSubmitting(true)
    try {
      await moveGoalFunds(goal.id, isDeposit ? value : -value)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo mover el dinero')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={Boolean(goal)}
      onClose={onClose}
      title={isDeposit ? `Aportar a ${goal?.name ?? ''}` : `Retirar de ${goal?.name ?? ''}`}
      description={
        goal?.isAuto
          ? 'Al mover dinero, esta meta pasa a modo Manual con el nuevo monto y el resto se reparte entre las metas automáticas.'
          : isDeposit
            ? 'El aporte se toma de tu ahorro disponible; las metas automáticas se reajustan.'
            : 'El retiro regresa a tu ahorro y se reparte entre las metas automáticas.'
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="funds-amount" className="text-sm font-semibold text-foreground">
              Monto
            </label>
            <button
              type="button"
              onClick={() => setAmount(String(roundMoney(max)))}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {`Usar máximo (${formatMoney(max)})`}
            </button>
          </div>
          <input
            id="funds-amount"
            autoFocus
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.keyCode === 229) return
              handleSubmit()
            }}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {(error || exceeds) && (
          <p className="rounded-xl bg-accent/12 px-3.5 py-2.5 text-sm font-medium text-accent" role="alert">
            {error ||
              (isDeposit
                ? `Superas el ahorro disponible para esta meta (${formatMoney(max)}).`
                : `Esta meta solo tiene ${formatMoney(max)} asignados.`)}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || exceeds || value <= 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
          >
            {isDeposit ? <Plus className="size-4" aria-hidden="true" /> : <Minus className="size-4" aria-hidden="true" />}
            {submitting ? 'Guardando…' : isDeposit ? 'Aportar' : 'Retirar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
