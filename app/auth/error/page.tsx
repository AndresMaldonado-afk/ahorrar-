import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  // `error` comes from the URL, so it is attacker-controlled. Render it only
  // when it looks like a Supabase error code, never as free text someone can
  // choose — otherwise this card will happily display their phishing copy.
  const code = params?.error
  const isErrorCode = typeof code === 'string' && /^[a-z0-9_]{1,64}$/.test(code)

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-7" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
            Algo salió mal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isErrorCode ? `Código de error: ${code}` : 'Ocurrió un error inesperado al validar tu enlace.'}
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </main>
  )
}
