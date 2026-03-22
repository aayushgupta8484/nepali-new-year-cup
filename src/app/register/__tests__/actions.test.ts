import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAction } from "../actions";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

const mockSignUp = vi.fn();

// Mock supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  }),
}));

describe("registerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({ data: null, error: null });
  });

  it("returns error when passwords do not match", async () => {
    const formData = new FormData();
    formData.set("full_name", "John Doe");
    formData.set("email", "john@example.com");
    formData.set("phone", "+9779812345678");
    formData.set("password", "secret123");
    formData.set("confirm_password", "different123");

    const result = await registerAction(formData);

    expect(result?.error).toBe("Passwords do not match");
  });

  it("returns error when email is invalid", async () => {
    const formData = new FormData();
    formData.set("full_name", "John Doe");
    formData.set("email", "not-an-email");
    formData.set("phone", "+9779812345678");
    formData.set("password", "secret123");
    formData.set("confirm_password", "secret123");

    const result = await registerAction(formData);

    expect(result?.error).toBe("Invalid email address");
  });

  it("returns error when password is too short", async () => {
    const formData = new FormData();
    formData.set("full_name", "John Doe");
    formData.set("email", "john@example.com");
    formData.set("phone", "+9779812345678");
    formData.set("password", "12345");
    formData.set("confirm_password", "12345");

    const result = await registerAction(formData);

    expect(result?.error).toBe("Password must be at least 6 characters");
  });

  it("returns error when phone is missing", async () => {
    const formData = new FormData();
    formData.set("full_name", "John Doe");
    formData.set("email", "john@example.com");
    formData.set("phone", "");
    formData.set("password", "secret123");
    formData.set("confirm_password", "secret123");

    const result = await registerAction(formData);

    expect(result?.error).toBe("Phone number is required");
  });

  it("calls supabase signUp with user metadata on valid input", async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: { id: "123" } }, error: null });

    const formData = new FormData();
    formData.set("full_name", "John Doe");
    formData.set("email", "john@example.com");
    formData.set("phone", "+9779812345678");
    formData.set("password", "secret123");
    formData.set("confirm_password", "secret123");

    await registerAction(formData);

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "john@example.com",
      password: "secret123",
      options: {
        data: {
          full_name: "John Doe",
          phone: "+9779812345678",
        },
      },
    });
  });

  it("returns error when supabase returns duplicate email error", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: null,
      error: { message: "User already registered" },
    });

    const formData = new FormData();
    formData.set("full_name", "John Doe");
    formData.set("email", "existing@example.com");
    formData.set("phone", "+9779812345678");
    formData.set("password", "secret123");
    formData.set("confirm_password", "secret123");

    const result = await registerAction(formData);

    expect(result?.error).toBe("Account already exists");
  });

  it("accepts various valid phone formats", async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: "123" } }, error: null });

    const validPhones = ["+9779800000000", "9800000000", "014123456"];

    for (const phone of validPhones) {
      const formData = new FormData();
      formData.set("full_name", "Jane Doe");
      formData.set("email", "jane@example.com");
      formData.set("phone", phone);
      formData.set("password", "secret123");
      formData.set("confirm_password", "secret123");

      const result = await registerAction(formData);

      expect(result?.error, `Phone "${phone}" should be valid`).toBeUndefined();
    }
  });
});
