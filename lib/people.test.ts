import { describe, expect, it } from "vitest";
import {
  ageOn,
  displayName,
  formatCpf,
  formatPhone,
  initials,
  isMinor,
  isValidCpf,
  isValidPhone,
  normalizePhone,
  whatsappHref,
} from "./people";

describe("age", () => {
  it("counts a birthday only once it arrives", () => {
    expect(ageOn("2008-10-15", "2026-10-14")).toBe(17);
    expect(ageOn("2008-10-14", "2026-10-14")).toBe(18);
    expect(isMinor("2008-10-15", "2026-10-14")).toBe(true);
    expect(isMinor("2008-10-14", "2026-10-14")).toBe(false);
  });

  it("handles a leap day birthday", () => {
    expect(ageOn("2008-02-29", "2026-02-28")).toBe(17);
    expect(ageOn("2008-02-29", "2026-03-01")).toBe(18);
  });
});

describe("cpf", () => {
  it("checks the verification digits", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("masks while typing", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
    expect(formatCpf("5299")).toBe("529.9");
    expect(formatCpf("5299822")).toBe("529.982.2");
  });
});

describe("phone", () => {
  it("normalizes Brazilian mobile and landline numbers", () => {
    expect(normalizePhone("+55 (81) 99999-1234")).toBe("81999991234");
    expect(isValidPhone("(81) 99999-1234")).toBe(true);
    expect(isValidPhone("(81) 3333-1234")).toBe(true);
    expect(isValidPhone("99999-1234")).toBe(false);
    expect(formatPhone("81999991234")).toBe("(81) 99999-1234");
    expect(formatPhone("8133331234")).toBe("(81) 3333-1234");
    expect(whatsappHref("(81) 99999-1234")).toBe("https://wa.me/5581999991234");
  });
});

describe("names", () => {
  it("prefers the social name and builds initials", () => {
    expect(displayName({ full_name: "João Silva", social_name: "Joana" })).toBe(
      "Joana",
    );
    expect(displayName({ full_name: "João Silva", social_name: null })).toBe(
      "João Silva",
    );
    expect(initials("maria das dores souza")).toBe("MS");
    expect(initials("Ana")).toBe("A");
  });
});
