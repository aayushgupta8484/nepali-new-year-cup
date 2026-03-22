"use client";

import { useState } from "react";
import Link from "next/link";
import { registerAction, type RegisterResult } from "./actions";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);

    // Client-side validation
    const email = (formData.get("email") as string)?.trim() ?? "";
    const phone = (formData.get("phone") as string)?.trim() ?? "";
    const password = (formData.get("password") as string) ?? "";
    const confirmPassword = (formData.get("confirm_password") as string) ?? "";

    if (!phone) {
      setError("Phone number is required");
      setPending(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email address");
      setPending(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setPending(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setPending(false);
      return;
    }

    try {
      const result: RegisterResult = await registerAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // redirect() throws — that means success
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register for the Nepali New Year Cup
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="full_name" className="text-sm font-medium">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone <span className="text-muted-foreground text-xs">(for WhatsApp)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="+977 98XXXXXXXX"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="At least 6 characters"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirm_password" className="text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="Repeat your password"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending} size="lg">
            {pending ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
