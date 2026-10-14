import { describe, expect, it } from "vitest";
import { whatsappText } from "./announcement";

describe("whatsappText", () => {
  it("puts the title in bold", () => {
    expect(whatsappText("Recesso", "Sem aulas")).toBe("*Recesso*\n\nSem aulas");
  });
});
