"use client";

import {
  ChevronDownIcon,
  LoaderCircleIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Card, Category } from "@/lib/data";
import {
  filtersHref,
  hasFilters,
  noFilters,
  type TransactionFilters,
} from "@/lib/filters";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

const kindOptions: Option[] = [
  { value: "expense", label: m.transactions.kinds.expense },
  { value: "income", label: m.transactions.kinds.income },
];

function archivedLast<T extends { archived_at: string | null }>(rows: T[]) {
  return [...rows].sort(
    (a, b) => Number(a.archived_at !== null) - Number(b.archived_at !== null),
  );
}

export function TransactionSearch({
  filters,
  month,
  categories,
  cards,
}: {
  filters: TransactionFilters;
  month: string;
  categories: Category[];
  cards: Card[];
}) {
  const router = useRouter();
  const [current, setCurrent] = useOptimistic(filters);
  const [query, setQuery] = useState(filters.query ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const input = useRef<HTMLInputElement>(null);
  const chips = useRef<HTMLFieldSetElement>(null);
  const searchId = useId();

  useEffect(() => {
    if (document.activeElement !== input.current) {
      setQuery(filters.query ?? "");
    }
  }, [filters.query]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function apply(next: TransactionFilters) {
    clearTimeout(timer.current);
    timer.current = undefined;
    startTransition(() => {
      setCurrent(next);
      router.replace(filtersHref(next, month), { scroll: false });
    });
  }

  function change(next: Partial<TransactionFilters>) {
    apply({ ...current, query: query.trim() || null, ...next });
  }

  function type(value: string) {
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => apply({ ...current, query: value.trim() || null }),
      300,
    );
  }

  const categoryOptions = archivedLast(
    categories.filter(
      (category) => !current.kind || category.kind === current.kind,
    ),
  ).map((category) => ({
    value: category.id,
    label: category.archived_at
      ? m.transactions.archivedCategory(category.name)
      : category.name,
  }));
  const paymentOptions = [
    { value: "pix", label: m.payments.pix },
    { value: "boleto", label: m.payments.boleto },
    ...archivedLast(cards).map((card) => ({
      value: card.id,
      label: card.archived_at
        ? m.transactions.archivedCard(card.name)
        : card.name,
    })),
  ];
  const SearchStatusIcon = pending ? LoaderCircleIcon : SearchIcon;

  return (
    <div className="flex flex-col gap-3">
      <search>
        <form
          className="relative"
          onSubmit={(event) => {
            event.preventDefault();
            change({});
          }}
        >
          <label htmlFor={searchId} className="sr-only">
            {m.transactions.search}
          </label>
          <SearchStatusIcon
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground",
              pending && "animate-spin",
            )}
          />
          <Input
            ref={input}
            id={searchId}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            maxLength={80}
            value={query}
            placeholder={m.transactions.searchPlaceholder}
            onChange={(event) => type(event.target.value)}
            onBlur={() => {
              if (timer.current !== undefined) change({});
            }}
            className="h-11 pr-11 pl-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label={m.transactions.clearSearch}
              className="absolute top-0 right-0 rounded-full"
              onClick={() => {
                setQuery("");
                apply({ ...current, query: null });
                input.current?.focus();
              }}
            >
              <XIcon aria-hidden="true" />
            </Button>
          )}
        </form>
      </search>
      <fieldset ref={chips} tabIndex={-1} className="min-w-0">
        <legend className="sr-only">{m.transactions.filters}</legend>
        <div className="-mx-4 -mt-1 flex gap-2 overflow-x-auto px-4 pt-1 pb-1 sm:-mx-1 sm:px-1">
          <FilterSelect
            label={m.transactions.kindFilter}
            value={current.kind ?? ""}
            options={kindOptions}
            onChange={(value) => {
              const kind =
                value === "expense" || value === "income" ? value : null;
              const category = categories.find(
                (candidate) => candidate.id === current.categoryId,
              );
              change({
                kind,
                categoryId:
                  kind && category && category.kind !== kind
                    ? null
                    : current.categoryId,
              });
            }}
          />
          <FilterSelect
            label={m.transactions.categoryFilter}
            value={current.categoryId ?? ""}
            options={categoryOptions}
            onChange={(value) => change({ categoryId: value || null })}
          />
          <FilterSelect
            label={m.transactions.paymentFilter}
            value={current.payment ?? ""}
            options={paymentOptions}
            onChange={(value) => change({ payment: value || null })}
          />
          {hasFilters(current) && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="shrink-0 rounded-full"
              onClick={() => {
                setQuery("");
                apply(noFilters);
                chips.current?.focus();
              }}
            >
              {m.transactions.clearFilters}
            </Button>
          )}
        </div>
      </fieldset>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label
      className={cn(
        "relative flex h-11 shrink-0 items-center rounded-full border bg-card text-body transition-colors md:text-subhead",
        value ? "border-link font-medium text-link" : "border-input",
      )}
    >
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-sizing-content h-full max-w-56 cursor-pointer appearance-none truncate rounded-full bg-transparent pr-9 pl-4"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute right-3 size-4"
      />
    </label>
  );
}
