'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  PieChart,
  Settings,
  Menu,
  X,
  PiggyBank,
  Sparkles,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFinance } from '@/components/finance-provider'

const navItems = [
  { label: 'Inicio', icon: LayoutDashboard, active: true },
  { label: 'Movimientos', icon: ArrowLeftRight, active: false },
  { label: 'Metas', icon: Target, active: false },
  { label: 'Presupuesto', icon: PieChart, active: false },
  { label: 'Ajustes', icon: Settings, active: false },
]

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <PiggyBank className="size-5" aria-hidden="true" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
        Ahorrar<span className="text-primary">+</span>
      </span>
    </div>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1.5" aria-label="Navegación principal">
      {navItems.map((item) => (
        <a
          key={item.label}
          href="#"
          onClick={onNavigate}
          aria-current={item.active ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors',
            item.active
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <item.icon className="size-5 shrink-0" aria-hidden="true" />
          {item.label}
        </a>
      ))}
    </nav>
  )
}

function ProTip() {
  return (
    <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
      <Sparkles className="size-5" aria-hidden="true" />
      <p className="mt-2 text-sm font-semibold leading-snug text-balance">
        Ahorra el 38% este mes y estarás 2 semanas más cerca de tu viaje.
      </p>
    </div>
  )
}

function NewMovementButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <Plus className="size-4" aria-hidden="true" />
      Nuevo movimiento
    </button>
  )
}

export function DashboardNav() {
  const [open, setOpen] = useState(false)
  const { setNewMovementOpen } = useFinance()

  const openMovement = () => {
    setOpen(false)
    setNewMovementOpen(true)
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-sidebar-border bg-sidebar p-5 lg:flex">
        <div className="flex flex-col gap-8">
          <Brand />
          <NavLinks />
        </div>
        <div className="flex flex-col gap-3">
          <NewMovementButton onClick={openMovement} />
          <ProTip />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </header>

      {/* Mobile slide-over */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col justify-between bg-sidebar p-5 shadow-xl">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground"
                  aria-label="Cerrar menú"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <div className="flex flex-col gap-3">
              <NewMovementButton onClick={openMovement} />
              <ProTip />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
