"use server"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export type LoginState = {
  error?: string
} | undefined

export async function loginAction(
  prevState: { returnUrl?: string } | undefined,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "Invalid email or password" }
  }

  redirect(prevState?.returnUrl ?? "/dashboard")
}
