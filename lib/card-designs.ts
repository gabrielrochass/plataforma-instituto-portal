export const cardFaces = {
  grafite: "bg-linear-135 from-[#48484a] to-[#1c1c1e] text-white",
  "meia-noite": "bg-linear-135 from-[#1e3a8a] to-[#0f172a] text-white",
  oceano: "bg-linear-135 from-[#0369a1] to-[#1e3a8a] text-white",
  floresta: "bg-linear-135 from-[#047857] to-[#064e3b] text-white",
  "por-do-sol": "bg-linear-135 from-[#c2410c] to-[#9d174d] text-white",
  ametista: "bg-linear-135 from-[#7e22ce] to-[#4c1d95] text-white",
  rosa: "bg-linear-135 from-[#e8448f] to-[#a3175a] text-white",
  tangerina: "bg-linear-135 from-[#fb923c] to-[#ea580c] text-[#1d1d1f]",
  ouro: "bg-linear-135 from-[#fde68a] to-[#d97706] text-[#1d1d1f]",
  prata: "bg-linear-135 from-[#f5f5f7] to-[#a1a1aa] text-[#1d1d1f]",
} as const;

export type CardDesign = keyof typeof cardFaces;

export const cardDesignKeys = Object.keys(cardFaces) as CardDesign[];

export function cardFace(design: string) {
  return cardFaces[design as CardDesign] ?? cardFaces.grafite;
}
