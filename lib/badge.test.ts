import { describe, expect, it } from "vitest";
import { badgePayload, badgeTokenOf } from "./badge";

describe("badge payload", () => {
  it("round trips the token and ignores other QR codes", () => {
    expect(badgeTokenOf(badgePayload("ABCDEFGH23"))).toBe("ABCDEFGH23");
    expect(badgeTokenOf("https://example.com")).toBeNull();
    expect(badgeTokenOf("portal:abc")).toBeNull();
  });
});
