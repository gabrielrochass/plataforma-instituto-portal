import type { PaletteColor } from "@/lib/palette";

export type StarterCategory = {
  name: string;
  icon: string;
  color: PaletteColor;
  kind: "expense" | "income";
  checked: boolean;
};

export const starterCategories: readonly StarterCategory[] = [
  {
    name: "Mercado",
    icon: "shopping-cart",
    color: "chart-3",
    kind: "expense",
    checked: true,
  },
  {
    name: "Casa",
    icon: "house",
    color: "chart-1",
    kind: "expense",
    checked: true,
  },
  {
    name: "Transporte",
    icon: "car",
    color: "chart-2",
    kind: "expense",
    checked: true,
  },
  {
    name: "Alimentação fora",
    icon: "utensils",
    color: "chart-4",
    kind: "expense",
    checked: true,
  },
  {
    name: "Saúde",
    icon: "heart-pulse",
    color: "chart-5",
    kind: "expense",
    checked: true,
  },
  {
    name: "Lazer",
    icon: "ticket",
    color: "chart-1",
    kind: "expense",
    checked: true,
  },
  {
    name: "Assinaturas",
    icon: "repeat",
    color: "chart-2",
    kind: "expense",
    checked: false,
  },
  {
    name: "Educação",
    icon: "graduation-cap",
    color: "chart-3",
    kind: "expense",
    checked: false,
  },
  {
    name: "Pets",
    icon: "paw-print",
    color: "chart-4",
    kind: "expense",
    checked: false,
  },
  {
    name: "Compras",
    icon: "shopping-bag",
    color: "chart-5",
    kind: "expense",
    checked: false,
  },
  {
    name: "Salário",
    icon: "briefcase",
    color: "chart-3",
    kind: "income",
    checked: true,
  },
  {
    name: "Freela",
    icon: "laptop",
    color: "chart-1",
    kind: "income",
    checked: false,
  },
];
