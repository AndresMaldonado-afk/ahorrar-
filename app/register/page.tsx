'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, PiggyBank, TriangleAlert } from 'lucide-react'
import { registerUser } from './actions'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error: registerError } = await registerUser(name, email, password)

    if (registerError) {
      setLoading(false)
      setError(registerError)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <PiggyBank className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              Ahorrar<span className="text-primary">+</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea tu cuenta y arma tu primer plan
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
            Crea tu cuenta
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Es gratis y toma menos de un minuto.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-semibold text-foreground">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Valentina Torres"
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-offset-2 transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-offset-2 transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-foreground">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-offset-2 transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-70"
            >
              {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {loading ? 'Creando cuenta…' : 'Registrarse'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
