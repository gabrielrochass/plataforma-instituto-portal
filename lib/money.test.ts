import { describe, expect, it } from "vitest";
import {
  formatBRL,
  formatCentsInput,
  formatPlainAmount,
  formatWholeBRL,
  parseCentsInput,
} from "./money";

const nbsp = String.fromCharCode(0xa0);

describe("formatBRL", () => {
  it("formats cents as pt-BR currency", () => {
    expect(formatBRL(123456)).toBe(`R$${nbsp}1.234,56`);
    expect(formatBRL(0)).toBe(`R$${nbsp}0,00`);
    expect(formatBRL(-1230)).toBe(`-R$${nbsp}12,30`);
  });
});

describe("formatWholeBRL", () => {
  it("rounds cents to whole reais", () => {
    expect(formatWholeBRL(107900)).toBe(`R$${nbsp}1.079`);
    expect(formatWholeBRL(79050)).toBe(`R$${nbsp}791`);
    expect(formatWholeBRL(79049)).toBe(`R$${nbsp}790`);
  });
});

describe("formatPlainAmount", () => {
  it("writes cents with a decimal comma and no thousands separator", () => {
    expect(formatPlainAmount(123456789)).toBe("1234567,89");
    expect(formatPlainAmount(5)).toBe("0,05");
    expect(formatPlainAmount(-1230)).toBe("-12,30");
  });
});

describe("parseCentsInput", () => {
  it("keeps only digits and reads them as cents", () => {
    expect(parseCentsInput("1990")).toBe(1990);
    expect(parseCentsInput("R$ 19,90")).toBe(1990);
    expect(parseCentsInput("-5")).toBe(5);
    expect(parseCentsInput("00012")).toBe(12);
    expect(parseCentsInput("")).toBe(0);
  });

  it("caps the value at ten digits", () => {
    expect(parseCentsInput("12345678901")).toBe(1234567890);
  });
});

describe("formatCentsInput", () => {
  it("shows cents without the currency symbol", () => {
    expect(formatCentsInput(1990)).toBe("19,90");
    expect(formatCentsInput(123456)).toBe("1.234,56");
    expect(formatCentsInput(0)).toBe("0,00");
  });
});
