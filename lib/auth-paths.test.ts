import { afterEach, describe, expect, it, vi } from "vitest";
import { isPublicPath, safeNext, signInPath, withNext } from "./auth-paths";

describe("isPublicPath", () => {
  it("opens the sign-in, sign-up and legal pages", () => {
    expect(isPublicPath("/entrar")).toBe(true);
    expect(isPublicPath("/cadastro")).toBe(true);
    expect(isPublicPath("/termos")).toBe(true);
    expect(isPublicPath("/privacidade")).toBe(true);
  });

  it("matches whole path segments only", () => {
    expect(isPublicPath("/entrar-agora")).toBe(false);
    expect(isPublicPath("/termos/v1")).toBe(true);
  });

  it("keeps the app private", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/ajustes/conta")).toBe(false);
    expect(isPublicPath("/cofrinhos")).toBe(false);
  });
});

describe("signInPath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the test session only on a local machine", () => {
    vi.stubEnv("DEV_AUTH", "1");
    vi.stubEnv("VERCEL_ENV", "");
    expect(signInPath()).toBe("/dev/entrar");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(signInPath()).toBe("/entrar");
  });

  it("uses the real sign-in page by default", () => {
    vi.stubEnv("DEV_AUTH", "");
    expect(signInPath()).toBe("/entrar");
  });
});

describe("safeNext", () => {
  it("keeps paths inside the app", () => {
    expect(safeNext("/cofrinhos")).toBe("/cofrinhos");
    expect(safeNext("/transacoes?mes=2026-10")).toBe("/transacoes?mes=2026-10");
  });

  it("refuses anything that leaves the app", () => {
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext(String.raw`/\evil.example`)).toBe("/");
    expect(safeNext("https://evil.example/")).toBe("/");
    expect(safeNext("javascript:alert(1)")).toBe("/");
    expect(safeNext("/.//evil.example")).toBe("/");
    expect(safeNext("/..//evil.example")).toBe("/");
    expect(safeNext("/%2e%2e//evil.example")).toBe("/");
    expect(safeNext("/a/..//evil.example")).toBe("/");
    expect(safeNext(null)).toBe("/");
  });

  it("survives malformed links", () => {
    expect(safeNext("//")).toBe("/");
    expect(safeNext("//[")).toBe("/");
  });
});

describe("withNext", () => {
  it("carries the return path only when it is not the home page", () => {
    expect(withNext("/cadastro", "/")).toBe("/cadastro");
    expect(withNext("/cadastro", "/transacoes?mes=2026-10")).toBe(
      "/cadastro?next=%2Ftransacoes%3Fmes%3D2026-10",
    );
  });
});
