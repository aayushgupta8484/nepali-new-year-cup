"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export type RegisterResult = { error: string } | undefined;

export async function registerAction(formData: FormData): Promise<RegisterResult> {
  const full_name = (formData.get("full_name") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim() ?? "";
  const phone = (formData.get("phone") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const confirm_password = (formData.get("confirm_password") as string) ?? "";

  // Validate phone
  if (!phone) {
    return { error: "Phone number is required" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email address" };
  }

  // Validate password length
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  // Validate password match
  if (password !== confirm_password) {
    return { error: "Passwords do not match" };
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        phone,
      },
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already exists")
    ) {
      return { error: "Account already exists" };
    }
    return { error: error.message };
  }

  redirect("/dashboard?registered=true");
}
