import { describe, expect, it } from "vitest";
import {
  filtersHref,
  hasFilters,
  noFilters,
  parseFilters,
  searchArgs,
} from "./filters";

const category = "11111111-1111-4111-8111-111111111111";
const card = "22222222-2222-4222-8222-222222222222";

describe("parseFilters", () => {
  it("reads every filter from the address", () => {
    expect(
      parseFilters({
        q: "  café   da manhã ",
        tipo: "despesa",
        categoria: category,
        pagamento: card,
      }),
    ).toEqual({
      query: "café da manhã",
      kind: "expense",
      categoryId: category,
      payment: card,
    });
  });

  it("ignores values it does not know", () => {
    expect(
      parseFilters({
        q: "   ",
        tipo: "outro",
        categoria: "nada",
        pagamento: "dinheiro",
      }),
    ).toEqual(noFilters);
  });

  it("caps the search at 80 characters and takes the first repeated value", () => {
    expect(parseFilters({ q: "a".repeat(120) }).query).toHaveLength(80);
    expect(parseFilters({ tipo: ["receita", "despesa"] }).kind).toBe("income");
    const emoji = String.fromCodePoint(0x1f600);
    expect(parseFilters({ q: `${"a".repeat(79)}${emoji}b` }).query).toBe(
      `${"a".repeat(79)}${emoji}`,
    );
  });
});

describe("filtersHref", () => {
  it("keeps the month and the filters", () => {
    expect(
      filtersHref(
        { query: "café", kind: "income", categoryId: null, payment: "pix" },
        "2026-10",
      ),
    ).toBe("/transacoes?mes=2026-10&q=caf%C3%A9&tipo=receita&pagamento=pix");
    expect(filtersHref(noFilters, "2026-09")).toBe("/transacoes?mes=2026-09");
  });
});

describe("hasFilters", () => {
  it("is false only without any filter", () => {
    expect(hasFilters(noFilters)).toBe(false);
    expect(hasFilters({ ...noFilters, kind: "expense" })).toBe(true);
  });
});

describe("searchArgs", () => {
  it("turns a card id into a card payment", () => {
    expect(searchArgs({ payment: card })).toEqual({
      p_query: undefined,
      p_kind: undefined,
      p_category_id: undefined,
      p_payment_kind: "card",
      p_card_id: card,
    });
    expect(searchArgs({ payment: "boleto" }).p_payment_kind).toBe("boleto");
    expect(searchArgs({ query: "cafe" }).p_query).toBe("cafe");
  });
});
