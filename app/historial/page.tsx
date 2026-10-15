'use client'

import { History, Loader2, PiggyBank } from 'lucide-react'
import { FinanceProvider, useFinance } from '@/components/finance-provider'
import { DashboardNav } from '@/components/dashboard-nav'
import { HistorySection } from '@/components/history-section'
import { NewMovementDialog } from '@/components/new-movement-dialog'

function PageLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <PiggyBank className="size-6" aria-hidden="true" />
      </span>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Cargando tu historial…
      </div>
    </div>
  )
}

function HistoryContent() {
  const { loading, error } = useFinance()

  if (loading) return <PageLoading />

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="px-4 pb-16 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pt-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {error && (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <History className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance">Historial</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                Compara tus últimos 6 meses y revisa cada movimiento del mes que elijas.
              </p>
            </div>
          </div>
          <HistorySection />
        </div>
      </main>
      <NewMovementDialog />
    </div>
  )
}

export default function HistorialPage() {
  return (
    <FinanceProvider>
      <HistoryContent />
    </FinanceProvider>
  )
}
