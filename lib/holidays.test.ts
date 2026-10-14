import { describe, expect, it } from "vitest";
import { easter, holidaysBetween, holidaysOf } from "./holidays";

describe("easter", () => {
  it("matches known dates", () => {
    expect(easter(2026)).toBe("2026-04-05");
    expect(easter(2027)).toBe("2027-03-28");
    expect(easter(2028)).toBe("2028-04-16");
  });
});

describe("holidaysOf", () => {
  it("includes movable, national, state and Recife holidays", () => {
    const days = holidaysOf(2027);
    expect(days.get("2027-02-08")).toBe("Carnaval");
    expect(days.get("2027-02-09")).toBe("Carnaval");
    expect(days.get("2027-03-26")).toBe("Sexta-feira Santa");
    expect(days.get("2027-05-27")).toBe("Corpus Christi");
    expect(days.get("2027-11-20")).toBe("Consciência Negra");
    expect(days.get("2027-03-06")).toBe("Data Magna de Pernambuco");
    expect(days.get("2027-07-16")).toBe("Nossa Senhora do Carmo");
  });
});

describe("holidaysBetween", () => {
  it("crosses the year and keeps only the range", () => {
    const days = holidaysBetween("2026-12-20", "2027-01-05");
    expect([...days.keys()]).toEqual(["2026-12-25", "2027-01-01"]);
  });
});
