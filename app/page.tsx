'use client'

import { Loader2, PiggyBank } from 'lucide-react'
import { FinanceProvider, useFinance } from '@/components/finance-provider'
import { DashboardNav } from '@/components/dashboard-nav'
import { GreetingHeader } from '@/components/greeting-header'
import { BalanceCards } from '@/components/balance-cards'
import { CashflowChart } from '@/components/cashflow-chart'
import { GoalsSection } from '@/components/goals-section'
import { BudgetBreakdown } from '@/components/budget-breakdown'
import { RecentTransactions } from '@/components/recent-transactions'
import { NewMovementDialog } from '@/components/new-movement-dialog'
import { ManageCategoriesDialog } from '@/components/manage-categories-dialog'

function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <PiggyBank className="size-6" aria-hidden="true" />
      </span>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Cargando tu plan financiero…
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
      {message}
    </div>
  )
}

function Dashboard() {
  const { loading, error } = useFinance()

  if (loading) {
    return <DashboardLoading />
  }

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="px-4 pb-16 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pt-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          {error && <ErrorBanner message={error} />}
          <GreetingHeader />
          <BalanceCards />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <CashflowChart />
              <BudgetBreakdown />
            </div>
            <div className="flex flex-col gap-6">
              <GoalsSection />
              <RecentTransactions />
            </div>
          </div>
        </div>
      </main>

      <NewMovementDialog />
      <ManageCategoriesDialog />
    </div>
  )
}

export default function Page() {
  return (
    <FinanceProvider>
      <Dashboard />
    </FinanceProvider>
  )
}
