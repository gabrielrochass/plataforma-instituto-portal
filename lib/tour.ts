export const tourSteps = [
  "novo",
  "saldo",
  "transacoes",
  "cofrinhos",
  "analises",
  "ajustes",
] as const;

export type TourStep = (typeof tourSteps)[number];

export type Box = { top: number; left: number; width: number; height: number };

export function availableSteps(hasTarget: (step: TourStep) => boolean) {
  return tourSteps.filter(hasTarget);
}

export function popupPlacement(
  target: Box,
  viewport: { width: number; height: number },
  popup: { width: number; height: number },
  gap = 16,
  gutter = 16,
) {
  const below = viewport.height - (target.top + target.height);
  const side =
    below >= popup.height + gap || below >= target.top ? "below" : "above";
  const top =
    side === "below"
      ? target.top + target.height + gap
      : target.top - gap - popup.height;
  const centered = target.left + target.width / 2 - popup.width / 2;
  const left = Math.min(
    Math.max(centered, gutter),
    viewport.width - gutter - popup.width,
  );
  return { side, top: Math.max(top, gutter), left: Math.max(left, gutter) };
}
