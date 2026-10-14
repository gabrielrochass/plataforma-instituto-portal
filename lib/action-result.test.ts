import { describe, expect, it } from "vitest";
import { failure, failureFor } from "./action-result";

describe("failureFor", () => {
  it("explains permission, lock and limit errors in plain words", () => {
    expect(failureFor({ code: "42501" })).toEqual({
      ok: false,
      message: "Você não tem permissão para isso.",
    });
    expect(failureFor({ code: "55000" }).ok).toBe(false);
    expect(failureFor({ code: "54000" }).ok).toBe(false);
  });

  it("falls back to try again for anything else", () => {
    expect(failureFor({ code: "XX000" })).toBe(failure);
    expect(failureFor({})).toBe(failure);
  });
});

describe("fieldErrors", () => {
  it("keeps nested paths so each field can show its own message", async () => {
    const { z } = await import("zod");
    const { fieldErrors } = await import("./action-result");
    const schema = z.object({
      name: z.string().min(1, "nome"),
      guardians: z.array(z.object({ phone: z.string().min(1, "telefone") })),
    });
    const result = schema.safeParse({ name: "", guardians: [{ phone: "" }] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toEqual({
        name: ["nome"],
        "guardians.0.phone": ["telefone"],
      });
    }
  });
});
