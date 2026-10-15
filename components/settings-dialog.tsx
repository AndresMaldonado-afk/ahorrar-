'use client'

import { useState } from 'react'
import {
  BookOpen,
  Palette,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  PieChart,
  History,
  Target,
  ArrowLeftRight,
  Sun,
  Moon,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { Modal } from '@/components/modal'
import { useTheme, type Theme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

type Tab = 'instrucciones' | 'temas'

const instructions: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: 'Balance total',
    description:
      'Es el dinero que tienes disponible: tus ingresos menos tus gastos y menos lo que has destinado a tus metas. Si tus gastos superan a tus ingresos, el monto se muestra en negativo y la tarjeta se pone roja hasta que vuelvas a números positivos.',
    icon: Wallet,
  },
  {
    title: 'Ingresos del mes',
    description:
      'Suma todo el dinero que recibiste durante el mes en curso, como sueldo, ventas o cualquier otra entrada. Te ayuda a saber con cuánto cuentas cada mes.',
    icon: TrendingUp,
  },
  {
    title: 'Gastos del mes',
    description:
      'Suma todo lo que gastaste durante el mes en curso. Compáralo con tus ingresos para saber si estás gastando más de lo que ganas.',
    icon: TrendingDown,
  },
  {
    title: 'Ahorrado',
    description:
      'Muestra el dinero que has destinado a tus metas. Aumenta cuando asignas saldo a una meta y disminuye cuando retiras. Solo puedes destinar dinero si tu balance total es positivo.',
    icon: PiggyBank,
  },
  {
    title: 'Presupuesto por categorías',
    description:
      'Reparte tus gastos del mes entre categorías (comida, transporte, ocio, etc.) y muestra cuánto has usado de cada una, para que veas en qué se va tu dinero y puedas controlarlo.',
    icon: PieChart,
  },
  {
    title: 'Historial',
    description:
      'Muestra cómo han evolucionado tus ingresos, gastos y ahorro mes a mes, para que identifiques tendencias y compares tu progreso con meses anteriores.',
    icon: History,
  },
  {
    title: 'Metas',
    description:
      'Crea objetivos de ahorro (un viaje, un auto, un fondo de emergencia) con un monto a alcanzar. Destina o retira saldo de cada meta y sigue su porcentaje de avance. Las metas conservan su monto al comenzar un nuevo mes.',
    icon: Target,
  },
  {
    title: 'Movimientos',
    description:
      'Lista de todos tus ingresos y gastos registrados. Desde aquí puedes agregar un nuevo movimiento, consultar su detalle, buscarlo, editarlo o eliminarlo.',
    icon: ArrowLeftRight,
  },
]

function Instructions() {
  return (
    <ul className="flex flex-col gap-3">
      {instructions.map((item) => (
        <li key={item.title} className="flex items-start gap-3 rounded-2xl bg-muted p-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <item.icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-foreground">{item.title}</h3>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground text-pretty">{item.description}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

const themeOptions: { value: Theme; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Claro', description: 'Fondo blanco, ideal para el día.', icon: Sun },
  { value: 'dark', label: 'Oscuro', description: 'Tonos oscuros cómodos para la vista.', icon: Moon },
]

function Themes() {
  const { theme, setTheme } = useTheme()
  return (
    <div role="radiogroup" aria-label="Tema de la aplicación" className="flex flex-col gap-3">
      {themeOptions.map((option) => {
        const selected = theme === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(option.value)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-colors',
              selected ? 'border-primary bg-secondary' : 'border-border bg-card hover:bg-muted',
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <option.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-bold text-foreground">{option.label}</span>
              <span className="block text-sm text-muted-foreground">{option.description}</span>
            </span>
            {selected && (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-4" aria-hidden="true" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('instrucciones')

  const tabs: { value: Tab; label: string; icon: LucideIcon }[] = [
    { value: 'instrucciones', label: 'Instrucciones', icon: BookOpen },
    { value: 'temas', label: 'Temas', icon: Palette },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Ajustes" description="Aprende a usar la app y personaliza su apariencia.">
      <div className="flex flex-col gap-4">
        <div role="tablist" aria-label="Opciones de ajustes" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-muted p-1.5">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                tab === t.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <t.icon className="size-4" aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel">{tab === 'instrucciones' ? <Instructions /> : <Themes />}</div>
      </div>
    </Modal>
  )
}
