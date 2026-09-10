import { DashboardNav } from '@/components/dashboard-nav'
import { GreetingHeader } from '@/components/greeting-header'
import { BalanceCards } from '@/components/balance-cards'
import { CashflowChart } from '@/components/cashflow-chart'
import { GoalsSection } from '@/components/goals-section'
import { BudgetBreakdown } from '@/components/budget-breakdown'
import { RecentTransactions } from '@/components/recent-transactions'
import { PlanCard } from '@/components/plan-card'

export default function Page() {
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="px-4 pb-16 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pt-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <GreetingHeader />
          <BalanceCards />
          <PlanCard />

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
    </div>
  )
}
