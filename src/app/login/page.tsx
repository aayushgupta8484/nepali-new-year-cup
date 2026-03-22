"use client"

import { useActionState } from "react"
import { loginAction, type LoginState } from "@/lib/actions/auth-actions"

export default function LoginPage({
  searchParams,
}: {
  searchParams: { returnUrl?: string }
}) {
  const loginWithReturnUrl = loginAction.bind(null, {
    returnUrl: searchParams.returnUrl,
  })

  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginWithReturnUrl,
    undefined
  )

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          {state?.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  )
}
