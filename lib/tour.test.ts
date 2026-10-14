import { describe, expect, it } from "vitest";
import { availableSteps, popupPlacement } from "./tour";

describe("availableSteps", () => {
  it("keeps the tour order and skips steps without a target", () => {
    expect(availableSteps((step) => step !== "saldo")).toEqual([
      "novo",
      "transacoes",
      "cofrinhos",
      "analises",
      "ajustes",
    ]);
  });
});

describe("popupPlacement", () => {
  const viewport = { width: 390, height: 844 };
  const popup = { width: 320, height: 180 };

  it("opens above a target at the bottom of the screen", () => {
    const tabBarItem = { top: 790, left: 160, width: 70, height: 44 };
    const placement = popupPlacement(tabBarItem, viewport, popup);
    expect(placement.side).toBe("above");
    expect(placement.top).toBe(790 - 16 - 180);
  });

  it("opens below a target near the top", () => {
    const gear = { top: 40, left: 330, width: 44, height: 44 };
    const placement = popupPlacement(gear, viewport, popup);
    expect(placement.side).toBe("below");
    expect(placement.top).toBe(100);
  });

  it("stays inside the screen gutters", () => {
    const gear = { top: 40, left: 330, width: 44, height: 44 };
    expect(popupPlacement(gear, viewport, popup).left).toBe(390 - 16 - 320);
    const corner = { top: 40, left: 0, width: 44, height: 44 };
    expect(popupPlacement(corner, viewport, popup).left).toBe(16);
  });
});
