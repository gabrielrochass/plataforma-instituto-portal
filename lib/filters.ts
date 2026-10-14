import type { Route } from "next";

export type TransactionFilters = {
  query: string | null;
  kind: "expense" | "income" | null;
  categoryId: string | null;
  payment: string | null;
};

type Param = string | string[] | undefined;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const kindByParam = { despesa: "expense", receita: "income" } as const;
const paramByKind = { expense: "despesa", income: "receita" } as const;

export const noFilters: TransactionFilters = {
  query: null,
  kind: null,
  categoryId: null,
  payment: null,
};

function first(value: Param) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFilters(params: {
  q?: Param;
  tipo?: Param;
  categoria?: Param;
  pagamento?: Param;
}): TransactionFilters {
  const query = Array.from(first(params.q)?.trim().replace(/\s+/g, " ") ?? "")
    .slice(0, 80)
    .join("");
  const kind = first(params.tipo);
  const categoryId = first(params.categoria);
  const payment = first(params.pagamento);
  return {
    query: query || null,
    kind: kind === "despesa" || kind === "receita" ? kindByParam[kind] : null,
    categoryId: categoryId && uuid.test(categoryId) ? categoryId : null,
    payment:
      payment === "pix" ||
      payment === "boleto" ||
      (payment && uuid.test(payment))
        ? payment
        : null,
  };
}

export function hasFilters(filters: TransactionFilters) {
  return Object.values(filters).some((value) => value !== null);
}

export function filtersHref(filters: TransactionFilters, month: string) {
  const params = new URLSearchParams({ mes: month });
  if (filters.query) params.set("q", filters.query);
  if (filters.kind) params.set("tipo", paramByKind[filters.kind]);
  if (filters.categoryId) params.set("categoria", filters.categoryId);
  if (filters.payment) params.set("pagamento", filters.payment);
  return `/transacoes?${params}` as Route;
}

function paymentKind(payment: string | null | undefined) {
  if (!payment) return undefined;
  if (payment === "pix") return "pix" as const;
  if (payment === "boleto") return "boleto" as const;
  return "card" as const;
}

export function searchArgs(filters: Partial<TransactionFilters>) {
  const kind = paymentKind(filters.payment);
  return {
    p_query: filters.query ?? undefined,
    p_kind: filters.kind ?? undefined,
    p_category_id: filters.categoryId ?? undefined,
    p_payment_kind: kind,
    p_card_id: kind === "card" ? (filters.payment ?? undefined) : undefined,
  };
}
