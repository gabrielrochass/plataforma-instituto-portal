import { describe, expect, it } from "vitest";
import { normalizeCertificateCode } from "./certificate";

describe("normalizeCertificateCode", () => {
  it("accepts codes typed loosely", () => {
    expect(normalizeCertificateCode(" abcd efgh 2345 ")).toBe("ABCD-EFGH-2345");
    expect(normalizeCertificateCode("ABCD-EFGH-2345")).toBe("ABCD-EFGH-2345");
  });

  it("rejects ambiguous characters and wrong sizes", () => {
    expect(normalizeCertificateCode("ABCD-EFGH-2340")).toBeNull();
    expect(normalizeCertificateCode("ABCD-EFGH")).toBeNull();
    expect(normalizeCertificateCode(undefined)).toBeNull();
  });
});
