'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Lock, Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import { Modal } from '@/components/modal'
import { useFinance } from '@/components/finance-provider'
import {
  distributeGoals,
  formatMoney,
  goalEmojiOptions,
  planGoalRebalance,
  roundMoney,
  type Goal,
  type GoalRebalancePlan,
} from '@/lib/finance-data'
import { cn } from '@/lib/utils'

export function GoalFormDialog({ open, onClose, goal }: { open: boolean; onClose: () => void; goal: Goal | null }) {
  const { goals, savings, autoDistribution, addGoal, updateGoal, deleteGoal } = useFinance()
  const isEdit = Boolean(goal)
  const [isAuto, setIsAuto] = useState(true)

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
    setIsAuto(goal ? goal.isAuto : autoDistribution)
    setRebalance(false)
    setConfirmDelete(false)
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goal])

  const targetValue = Number.parseFloat(target) || 0
  const savedValue = Math.max(0, Number.parseFloat(saved) || 0)
  const pct = targetValue > 0 ? Math.min(100, Math.round((savedValue / targetValue) * 100)) : 0
  const availableForGoal = roundMoney(
    (goal && !goal.isAuto ? goal.storedSaved : 0) + Math.max(0, savings.unlocked),
  )

  const plan = useMemo<GoalRebalancePlan>(() => {
    if (isAuto) return { kind: 'fits' }
    return planGoalRebalance({
      goals: goals.filter((g) => !g.isAuto),
      goalId: goal?.id ?? null,
      newAmount: savedValue,
      freeSavings: savings.unlocked,
    })
  }, [isAuto, goals, goal, savedValue, savings.unlocked])

  const autoPreview = useMemo(() => {
    if (!isAuto || targetValue <= 0) return null
    const draftId = goal?.id ?? '__draft__'
    const draft = { id: draftId, isAuto: true, storedSaved: 0, target: targetValue }
    const others = goals.filter((g) => g.id !== draftId)
    const { amounts } = distributeGoals([...others, draft], savings.total)
    const amount = amounts.get(draftId) ?? 0
    return { amount, pct: Math.min(100, Math.round((amount / targetValue) * 100)), sharedWith: others.filter((g) => g.isAuto).length + 1 }
  }, [isAuto, targetValue, goal, goals, savings.total])

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
    if (blocked) return setError('No tienes suficiente ahorro para fijar ese monto.')

    setSubmitting(true)
    setError('')
    try {
      const payload = {
        name,
        emoji,
        target: targetValue,
        deadline: deadline || null,
        saved: isAuto ? 0 : savedValue,
        isAuto,
      }
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
      description="El dinero asignado sale de tu ahorro (ingresos menos gastos). Las metas manuales se descuentan primero y el resto se reparte entre las automáticas."
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

        <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4">
          <div className="flex flex-col gap-2">
            <p id="goal-mode-label" className={labelClass}>
              Modo de distribución
            </p>
            <div role="radiogroup" aria-labelledby="goal-mode-label" className="grid grid-cols-2 gap-1 rounded-xl bg-background p-1">
              {[
                { value: true, label: 'Automático', Icon: Sparkles },
                { value: false, label: 'Manual', Icon: Lock },
              ].map(({ value, label, Icon }) => (
                <button
                  key={label}
                  type="button"
                  role="radio"
                  aria-checked={isAuto === value}
                  onClick={() => {
                    if (!value && isAuto && autoPreview && !saved) setSaved(String(autoPreview.amount))
                    setIsAuto(value)
                  }}
                  className={cn(
                    'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                    isAuto === value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isAuto ? (
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {autoPreview
                ? `Recibirá ${formatMoney(autoPreview.amount)} (${autoPreview.pct}% del objetivo), una parte igual del ahorro disponible entre ${autoPreview.sharedWith} ${autoPreview.sharedWith === 1 ? 'meta automática' : 'metas automáticas'}. Se recalcula solo cuando cambian tus ingresos, gastos o metas.`
                : 'Escribe el monto objetivo para ver cuánto recibirá esta meta del reparto equitativo.'}
            </p>
          ) : (
          <>
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="goal-saved" className={labelClass}>
              Monto fijo
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
              {`Superas tu ahorro disponible por ${formatMoney(plan.shortfall)}. Como máximo puedes fijar ${formatMoney(plan.maxAssignable)} aunque reajustes tus otras metas.`}
            </p>
          )}

          {plan.kind === 'rebalance' && (
            <div className="flex flex-col gap-2 rounded-xl bg-accent/12 px-3 py-2.5" role="alert">
              <p className="flex gap-2 text-sm font-medium text-accent">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {`Te faltan ${formatMoney(plan.shortfall)} de ahorro disponible para este monto.`}
              </p>
              <label className="flex items-start gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={rebalance}
                  onChange={(e) => setRebalance(e.target.checked)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>Tomar la diferencia de mis otras metas manuales de forma proporcional</span>
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
          </>
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
