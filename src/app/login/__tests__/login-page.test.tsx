import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}))

// Mock the auth actions at module level
vi.mock("@/lib/actions/auth-actions", () => ({
  loginAction: vi.fn(),
}))

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it("renders email and password inputs and a submit button", async () => {
    const { loginAction } = await import("@/lib/actions/auth-actions")
    vi.mocked(loginAction).mockResolvedValue(undefined)

    const LoginPage = (await import("@/app/login/page")).default
    render(<LoginPage searchParams={{}} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in|log in|login/i })).toBeInTheDocument()
  })

  it("displays error message when login fails with invalid credentials", async () => {
    const { loginAction } = await import("@/lib/actions/auth-actions")
    vi.mocked(loginAction).mockResolvedValue({ error: "Invalid email or password" })

    const LoginPage = (await import("@/app/login/page")).default
    render(<LoginPage searchParams={{}} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    fireEvent.change(emailInput, { target: { value: "user@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } })

    await act(async () => {
      fireEvent.submit(emailInput.closest("form")!)
    })

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })
})
