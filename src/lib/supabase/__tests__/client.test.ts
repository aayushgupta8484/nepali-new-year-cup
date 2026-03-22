import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("createBrowserClient", () => {
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
    const { createBrowserClient } = await import("@/lib/supabase/client");
    const client = createBrowserClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
    expect(typeof client.auth).toBe("object");
  });

  it("returns the same singleton instance on subsequent calls", async () => {
    const { createBrowserClient } = await import("@/lib/supabase/client");
    const client1 = createBrowserClient();
    const client2 = createBrowserClient();
    expect(client1).toBe(client2);
  });

  it("throws a descriptive error when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { createBrowserClient } = await import("@/lib/supabase/client");
    expect(() => createBrowserClient()).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("throws a descriptive error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { createBrowserClient } = await import("@/lib/supabase/client");
    expect(() => createBrowserClient()).toThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });
});
