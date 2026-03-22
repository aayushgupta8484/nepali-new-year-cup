import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock next/headers before importing the module under test
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("createServerClient", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns a Supabase client instance", async () => {
    const { cookies } = await import("next/headers");
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const { createServerClient } = await import("@/lib/supabase/server");
    const client = await createServerClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
    expect(typeof client.auth).toBe("object");
  });

  it("creates a new client on each call (not a singleton)", async () => {
    const { cookies } = await import("next/headers");
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const { createServerClient } = await import("@/lib/supabase/server");
    const client1 = await createServerClient();
    const client2 = await createServerClient();
    expect(client1).not.toBe(client2);
  });

  it("throws a descriptive error when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { createServerClient } = await import("@/lib/supabase/server");
    await expect(createServerClient()).rejects.toThrow(
      "NEXT_PUBLIC_SUPABASE_URL"
    );
  });

  it("throws a descriptive error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { createServerClient } = await import("@/lib/supabase/server");
    await expect(createServerClient()).rejects.toThrow(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  });

  it("integrates with the Next.js cookie store for getAll", async () => {
    const { cookies } = await import("next/headers");
    const mockCookies = [{ name: "sb-token", value: "abc123" }];
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue(mockCookies),
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const { createServerClient } = await import("@/lib/supabase/server");
    const client = await createServerClient();
    expect(client).toBeDefined();
    expect(mockCookieStore.getAll).toHaveBeenCalled();
  });
});
