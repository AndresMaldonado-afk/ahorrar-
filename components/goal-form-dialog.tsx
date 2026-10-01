'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Plus, Save, Trash2 } from 'lucide-react'
import { Modal } from '@/components/modal'
import { useFinance } from '@/components/finance-provider'
import { formatMoney, goalEmojiOptions, planGoalRebalance, roundMoney, type Goal } from '@/lib/finance-data'
import { cn } from '@/lib/utils'

export function GoalFormDialog({ open, onClose, goal }: { open: boolean; onClose: () => void; goal: Goal | null }) {
  const { goals, savings, addGoal, updateGoal, deleteGoal } = useFinance()
  const isEdit = Boolean(goal)

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saved, setSaved] = useState('')
  const [rebalance, setRebalance] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(goal?.name ?? '')
    setEmoji(goal?.emoji ?? '🎯')
    setTarget(goal ? String(goal.target) : '')
    setDeadline(goal?.deadline ?? '')
    setSaved(goal ? String(goal.saved) : '')
    setRebalance(false)
    setConfirmDelete(false)
    setError('')
  }, [open, goal])

  const targetValue = Number.parseFloat(target) || 0
  const savedValue = Math.max(0, Number.parseFloat(saved) || 0)
  const pct = targetValue > 0 ? Math.min(100, Math.round((savedValue / targetValue) * 100)) : 0
  const availableForGoal = roundMoney((goal?.saved ?? 0) + Math.max(0, savings.free))

  const plan = useMemo(
    () => planGoalRebalance({ goals, goalId: goal?.id ?? null, newAmount: savedValue, freeSavings: savings.free }),
    [goals, goal, savedValue, savings.free],
  )

  const blocked = plan.kind === 'impossible' || (plan.kind === 'rebalance' && !rebalance)

  const inputClass =
    'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'
  const labelClass = 'text-sm font-semibold text-foreground'

  function handlePercent(value: number) {
    if (targetValue <= 0) return
    setSaved(String(roundMoney((targetValue * value) / 100)))
  }

  async function handleSubmit() {
    if (!name.trim()) return setError('Escribe un nombre para la meta')
    if (!(targetValue > 0)) return setError('El monto objetivo debe ser mayor a 0')
    if (blocked) return setError('No tienes suficiente ahorro libre para asignar ese monto.')

    setSubmitting(true)
    setError('')
    try {
      const payload = { name, emoji, target: targetValue, deadline: deadline || null, saved: savedValue }
      if (isEdit && goal) await updateGoal(goal.id, payload, { rebalance })
      else await addGoal(payload, { rebalance })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la meta')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!goal) return
    setSubmitting(true)
    try {
      await deleteGoal(goal.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la meta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar meta' : 'Nueva meta de ahorro'}
      description="El dinero asignado sale de tu ahorro libre (ingresos menos gastos)."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="goal-name" className={labelClass}>
            Nombre de la meta
          </label>
          <input
            id="goal-name"
            autoFocus
            maxLength={80}
            placeholder="Ej. Viaje a la playa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground">Icono</p>
          <div className="grid grid-cols-10 gap-1.5">
            {goalEmojiOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEmoji(option)}
                aria-pressed={emoji === option}
                aria-label={`Usar emoji ${option}`}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-xl text-base transition-colors',
                  emoji === option ? 'bg-primary/15 ring-2 ring-primary' : 'bg-background hover:bg-muted',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal-target" className={labelClass}>
              Monto objetivo
            </label>
            <input
              id="goal-target"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="25000"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal-deadline" className={labelClass}>
              Fecha límite
            </label>
            <input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="goal-saved" className={labelClass}>
              Monto asignado
            </label>
            <span className="text-xs text-muted-foreground">
              Disponible: <span className="font-semibold text-foreground">{formatMoney(availableForGoal)}</span>
            </span>
          </div>
          <input
            id="goal-saved"
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="0"
            value={saved}
            onChange={(e) => setSaved(e.target.value)}
            className={inputClass}
          />
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              disabled={targetValue <= 0}
              onChange={(e) => handlePercent(Number(e.target.value))}
              aria-label="Porcentaje del objetivo asignado"
              className="flex-1 accent-primary disabled:opacity-50"
            />
            <span className="w-10 text-right text-xs font-bold text-muted-foreground">{pct}%</span>
          </div>

          {plan.kind === 'impossible' && (
            <p className="flex gap-2 rounded-xl bg-accent/12 px-3 py-2.5 text-sm font-medium text-accent" role="alert">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {`Superas tu ahorro libre por ${formatMoney(plan.shortfall)}. Como máximo puedes asignar ${formatMoney(plan.maxAssignable)} aunque reajustes tus otras metas.`}
            </p>
          )}

          {plan.kind === 'rebalance' && (
            <div className="flex flex-col gap-2 rounded-xl bg-accent/12 px-3 py-2.5" role="alert">
              <p className="flex gap-2 text-sm font-medium text-accent">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {`Te faltan ${formatMoney(plan.shortfall)} de ahorro libre para este monto.`}
              </p>
              <label className="flex items-start gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={rebalance}
                  onChange={(e) => setRebalance(e.target.checked)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>Tomar la diferencia de mis otras metas de forma proporcional</span>
              </label>
              {rebalance && (
                <ul className="flex flex-col gap-1 pl-6 text-xs text-muted-foreground">
                  {plan.adjustments.map((a) => {
                    const other = goals.find((g) => g.id === a.id)
                    return (
                      <li key={a.id} className="flex justify-between gap-2">
                        <span className="truncate">
                          {other?.emoji} {other?.name}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatMoney(a.from)} {'→'} {formatMoney(a.to)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-accent/12 px-3.5 py-2.5 text-sm font-medium text-accent" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {isEdit ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-70"
                >
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-2xl px-3 py-3 text-sm font-semibold text-muted-foreground"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-accent hover:bg-accent/10"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Eliminar meta
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
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
              disabled={submitting || blocked}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
            >
              {isEdit ? <Save className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear meta'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
