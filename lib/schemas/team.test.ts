import { describe, expect, it } from "vitest";
import { acceptInviteInput, unitInput } from "./team";

describe("unitInput", () => {
  it("normalizes the code to upper case", () => {
    const parsed = unitInput.parse({
      id: "0a000000-0000-4000-8000-000000000003",
      code: " ib ",
      name: "Imbiribeira",
    });
    expect(parsed.code).toBe("IB");
  });

  it("refuses accents and long codes", () => {
    const base = { id: "0a000000-0000-4000-8000-000000000003", name: "X" };
    expect(unitInput.safeParse({ ...base, code: "SÃO" }).success).toBe(false);
    expect(unitInput.safeParse({ ...base, code: "ABCDEFG" }).success).toBe(
      false,
    );
  });
});

describe("acceptInviteInput", () => {
  it("needs a name, an e-mail and a long enough password", () => {
    const result = acceptInviteInput.safeParse({
      name: " ",
      email: "ana",
      password: "123",
    });
    expect(result.success).toBe(false);
    expect(
      acceptInviteInput.parse({
        name: " Ana ",
        email: "ANA@Portal.local ",
        password: "uma frase longa",
      }),
    ).toEqual({
      name: "Ana",
      email: "ana@portal.local",
      password: "uma frase longa",
    });
  });
});
