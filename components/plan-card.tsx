import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export function PlanCard() {
  return (
    <section className="relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-accent p-6 text-accent-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="relative z-10 flex max-w-sm flex-col gap-3">
        <span className="w-fit rounded-full bg-accent-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          Tu plan de la semana
        </span>
        <h2 className="font-display text-2xl font-extrabold leading-tight text-balance">
          Aparta $500 hoy y completa tu fondo de emergencia en 6 meses
        </h2>
        <p className="text-sm text-accent-foreground/85 text-pretty">
          Convertimos tus metas grandes en pequeños pasos automáticos y fáciles de cumplir.
        </p>
        <button
          type="button"
          className="mt-1 inline-flex w-fit items-center gap-2 rounded-2xl bg-accent-foreground px-5 py-3 text-sm font-semibold text-accent transition-transform hover:-translate-y-0.5"
        >
          Empezar mi plan
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="relative z-10 mx-auto w-40 shrink-0 sm:mx-0 sm:w-48">
        <Image
          src="/images/plan-illustration.png"
          alt="Ilustración de una alcancía junto a una planta de dinero en crecimiento"
          width={320}
          height={320}
          className="h-auto w-full drop-shadow-md"
          priority
        />
      </div>
    </section>
  )
}
