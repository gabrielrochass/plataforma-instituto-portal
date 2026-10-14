export const paletteColors = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-other",
] as const;

export type PaletteColor = (typeof paletteColors)[number];

export const swatchClass: Record<PaletteColor, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
  "chart-other": "bg-chart-other",
};

export function swatch(color: string) {
  return swatchClass[color as PaletteColor] ?? swatchClass["chart-other"];
}

export function swatchColor(color: string) {
  const token = (paletteColors as readonly string[]).includes(color)
    ? color
    : "chart-other";
  return `var(--${token})`;
}
