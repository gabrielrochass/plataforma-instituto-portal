const MAX_DIGITS = 10;

export const brl = { style: "currency", currency: "BRL" } as const;

export const wholeBrl = {
  ...brl,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} as const;

const currency = new Intl.NumberFormat("pt-BR", brl);

const wholeCurrency = new Intl.NumberFormat("pt-BR", wholeBrl);

const plainAmount = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function toReais(cents: number, whole = false) {
  return whole ? Math.round(cents / 100) : cents / 100;
}

export function formatWholeBRL(cents: number) {
  return wholeCurrency.format(toReais(cents, true));
}

export function formatBRL(cents: number) {
  return currency.format(toReais(cents));
}

export function formatPlainAmount(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const whole = Math.floor(Math.abs(cents) / 100);
  const fraction = String(Math.abs(cents) % 100).padStart(2, "0");
  return `${sign}${whole},${fraction}`;
}

export function formatCentsInput(cents: number) {
  return plainAmount.format(cents / 100);
}

export function parseCentsInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, MAX_DIGITS);
  return digits ? Number.parseInt(digits, 10) : 0;
}
