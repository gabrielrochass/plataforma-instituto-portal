import { describe, expect, it } from "vitest";
import { credentials, signInInput } from "./credentials";

describe("credentials", () => {
  it("normalizes the e-mail", () => {
    expect(
      credentials.parse({ email: "  Ana@Exemplo.com ", password: "12345678" })
        .email,
    ).toBe("ana@exemplo.com");
  });

  it("accepts any password from 8 to 72 bytes", () => {
    const email = "ana@exemplo.com";
    expect(
      credentials.safeParse({ email, password: "a".repeat(8) }).success,
    ).toBe(true);
    expect(
      credentials.safeParse({ email, password: "a".repeat(72) }).success,
    ).toBe(true);
    expect(
      credentials.safeParse({ email, password: "a".repeat(7) }).success,
    ).toBe(false);
    expect(
      credentials.safeParse({ email, password: "a".repeat(73) }).success,
    ).toBe(false);
    expect(
      credentials.safeParse({ email, password: "ç".repeat(37) }).success,
    ).toBe(false);
  });

  it("refuses an invalid e-mail", () => {
    expect(
      credentials.safeParse({ email: "ana@", password: "12345678" }).success,
    ).toBe(false);
  });
});

describe("signInInput", () => {
  it("does not judge the length of an existing password", () => {
    expect(
      signInInput.safeParse({ email: "ana@exemplo.com", password: "123" })
        .success,
    ).toBe(true);
    expect(
      signInInput.safeParse({ email: "ana@exemplo.com", password: "" }).success,
    ).toBe(false);
  });
});
