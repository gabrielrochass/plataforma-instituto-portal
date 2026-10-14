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
