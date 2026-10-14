import { describe, expect, it } from "vitest";
import { bom, csvCell, toCsv } from "./csv";
import { cardsCsv, jarEntriesCsv, jarsCsv, transactionsCsv } from "./export";

function lines(csv: string) {
  return csv.slice(bom.length).trimEnd().split("\r\n");
}

describe("toCsv", () => {
  it("starts with a byte order mark and uses CRLF and semicolons", () => {
    const csv = toCsv(["a", "b"], [["1", "2"]]);
    expect(csv.startsWith(bom)).toBe(true);
    expect(csv).toBe(`${bom}"a";"b"\r\n"1";"2"\r\n`);
  });

  it("quotes every cell and doubles inner quotes", () => {
    expect(csvCell('Almoço "executivo"; centro')).toBe(
      '"Almoço ""executivo""; centro"',
    );
    expect(csvCell(null)).toBe('""');
  });

  it("keeps spreadsheets from running formulas", () => {
    expect(csvCell("=SOMA(A1:A9)")).toBe(`"'=SOMA(A1:A9)"`);
    expect(csvCell("+55 81 9999")).toBe(`"'+55 81 9999"`);
    expect(csvCell("@usuario")).toBe(`"'@usuario"`);
  });
});

describe("transactionsCsv", () => {
  it("writes one friendly row per entry", () => {
    const csv = transactionsCsv(
      [
        {
          kind: "expense",
          amount_cents: 4590,
          occurred_on: "2026-10-02",
          description: "Almoço",
          category_id: "cat",
          payment_kind: "pix",
          card_id: null,
          bill_due_on: null,
          installment_number: null,
          installment_count: null,
        },
        {
          kind: "expense",
          amount_cents: 100000,
          occurred_on: "2026-10-03",
          description: null,
          category_id: "cat",
          payment_kind: "card",
          card_id: "card",
          bill_due_on: "2026-11-10",
          installment_number: 3,
          installment_count: 10,
        },
      ],
      [{ id: "cat", name: "Restaurantes" }],
      [{ id: "card", name: "Nubank" }],
    );
    expect(lines(csv)).toEqual([
      '"Data";"Tipo";"Valor";"Descrição";"Categoria";"Pagamento";"Cartão";"Vencimento da fatura";"Parcela"',
      '"2026-10-02";"Despesa";"45,90";"Almoço";"Restaurantes";"Pix";"";"";""',
      '"2026-10-03";"Despesa";"1000,00";"";"Restaurantes";"Cartão";"Nubank";"2026-11-10";"3 de 10"',
    ]);
  });
});

describe("jarEntriesCsv", () => {
  it("names the opening balance and the movements", () => {
    const csv = jarEntriesCsv(
      [
        {
          jar_id: "jar",
          kind: "deposit",
          amount_cents: 200000,
          occurred_on: "2026-10-01",
          note: null,
          is_opening: true,
        },
        {
          jar_id: "jar",
          kind: "withdrawal",
          amount_cents: 30000,
          occurred_on: "2026-10-04",
          note: "Passaporte",
          is_opening: false,
        },
      ],
      [{ id: "jar", name: "Viagem" }],
    );
    expect(lines(csv).slice(1)).toEqual([
      '"Viagem";"2026-10-01";"Saldo inicial";"2000,00";""',
      '"Viagem";"2026-10-04";"Retirada";"300,00";"Passaporte"',
    ]);
  });
});

describe("jarsCsv and cardsCsv", () => {
  it("translate icons, colors and card designs", () => {
    const jars = jarsCsv([
      {
        name: "Viagem",
        icon: "plane",
        color: "chart-1",
        target_cents: 1500000,
        target_date: "2027-12-31",
        planned_monthly_cents: null,
        archived_at: null,
        created_at: "2026-10-05T02:30:00+00:00",
      },
    ]);
    expect(lines(jars)[1]).toBe(
      '"Viagem";"Avião";"Azul";"15000,00";"2027-12-31";"";"";"2026-10-04"',
    );
    const cards = cardsCsv([
      {
        name: "Nubank",
        design: "rosa",
        best_purchase_day: 3,
        due_day: 10,
        archived_at: null,
        created_at: "2026-10-05T12:00:00+00:00",
      },
    ]);
    expect(lines(cards)[1]).toBe('"Nubank";"Rosa";"3";"10";"";"2026-10-05"');
  });
});
