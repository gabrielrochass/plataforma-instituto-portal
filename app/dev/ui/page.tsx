import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Balance } from "@/components/analytics/balance";
import { CategoryBreakdown } from "@/components/analytics/category-breakdown";
import { CategoryDonut } from "@/components/analytics/category-donut";
import { UnusualSpending } from "@/components/analytics/insights";
import { LimitList } from "@/components/analytics/limit-list";
import { MonthSummary } from "@/components/analytics/month-summary";
import { TrendChart } from "@/components/analytics/trend-chart";
import { JarEntries } from "@/components/jars/jar-entries";
import { JarForecast } from "@/components/jars/jar-forecast";
import { JarProgress, JarStatusLabel } from "@/components/jars/jar-summary";
import { TransactionSearch } from "@/components/transactions/transaction-search";
import { Button } from "@/components/ui/button";
import { monthBars } from "@/lib/analytics";
import type { Category, JarSnapshot } from "@/lib/data";
import { noFilters } from "@/lib/filters";
import { forecastJar } from "@/lib/goals";

export const metadata: Metadata = {
  title: "Galeria de componentes",
  robots: { index: false },
};

const variants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "expense",
  "income",
  "link",
] as const;

const textTokens = [
  ["text-foreground", "Texto principal"],
  ["text-muted-foreground", "Texto secundário"],
  ["text-link", "Link"],
  ["text-income", "Receita +R$ 120,00"],
  ["text-expense", "Despesa R$ 45,90"],
  ["text-warning", "Perto do limite"],
  ["text-destructive", "Acima do limite"],
] as const;

const sampleCategory = (
  id: string,
  name: string,
  icon: string,
  color: string,
): Category => ({
  id,
  kind: "expense",
  name,
  icon,
  color,
  monthly_limit_cents: null,
  archived_at: null,
});

const market = sampleCategory("1", "Mercado", "shopping-cart", "chart-3");
const food = sampleCategory("2", "Restaurantes", "utensils", "chart-2");
const rides = sampleCategory("3", "Transporte", "car", "chart-1");
const home = sampleCategory("4", "Casa", "house", "chart-4");
const fun = sampleCategory("5", "Lazer", "music", "chart-5");
const pets = sampleCategory("6", "Pets", "paw-print", "chart-1");

const sampleBars = monthBars(
  new Map([
    ["2026-05", 98000],
    ["2026-06", 121000],
    ["2026-07", 87000],
    ["2026-08", 143000],
    ["2026-09", 112000],
    ["2026-10", 64000],
  ]),
  "2026-10",
  "2026-05-01",
);

function AnalyticsSamples() {
  return (
    <div className="flex flex-col gap-4">
      <Balance
        id="saldo-negativo"
        title="Saldo de outubro"
        income={300000}
        expenses={424000}
        comparison={{
          current: 424000,
          previous: 454000,
          reference: "no mesmo período de setembro",
        }}
      />
      <Balance
        id="saldo-positivo"
        title="Saldo de setembro"
        income={540000}
        expenses={412000}
      />
      <MonthSummary
        title="Gastos em outubro"
        cents={64000}
        comparison={{
          current: 64000,
          previous: 71000,
          reference: "no mesmo período de setembro",
        }}
        income={540000}
      />
      <TrendChart
        bars={sampleBars}
        average={112200}
        selected="2026-09"
        current="2026-10"
        hrefFor={() => "/dev/ui"}
      />
      <CategoryDonut
        rows={[
          { category: market, cents: 31245 },
          { category: home, cents: 22000 },
          { category: food, cents: 18900 },
          { category: rides, cents: 9600 },
          { category: fun, cents: 6400 },
          { category: pets, cents: 3100 },
        ]}
        total={91245}
        hrefFor={() => "/dev/ui"}
        othersHref="/dev/ui"
      />
      <CategoryBreakdown
        rows={[
          { category: market, cents: 31245 },
          { category: food, cents: 18900 },
          { category: rides, cents: 4590 },
        ]}
        total={64000}
        hrefFor={() => "/dev/ui"}
      />
      <LimitList
        rows={[
          { category: market, spent: 31245, limit: 80000, href: "/dev/ui" },
          { category: food, spent: 45000, limit: 40000, href: "/dev/ui" },
        ]}
      />
      <UnusualSpending
        items={[
          { category: food, spent: 75000, usual: 41000, href: "/dev/ui" },
        ]}
        monthName="setembro"
      />
    </div>
  );
}

const sampleJar: JarSnapshot = {
  jar: {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Viagem ao Japão",
    icon: "plane",
    color: "chart-1",
    target_cents: 1_500_000,
    target_date: "2027-04-30",
    planned_monthly_cents: null,
    archived_at: null,
    created_at: "2026-05-01T12:00:00Z",
  },
  balance: 745_000,
  forecast: forecastJar({
    target: 1_500_000,
    targetDate: "2027-04-30",
    planned: null,
    start: { on: "2026-05-01", cents: 300_000 },
    balance: 745_000,
    nets: new Map([
      ["2026-05", 80_000],
      ["2026-06", 90_000],
      ["2026-07", 70_000],
      ["2026-08", 70_000],
      ["2026-09", 85_000],
    ]),
    firstMonth: "2026-05",
    today: "2026-10-05",
  }),
};

function JarSamples() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-5">
        <JarProgress snapshot={sampleJar} />
        <div className="flex flex-wrap gap-4">
          <JarStatusLabel status="done" />
          <JarStatusLabel status="on-track" />
          <JarStatusLabel status="behind" />
        </div>
      </div>
      <JarForecast snapshot={sampleJar} />
      <JarEntries
        jarId={sampleJar.jar.id}
        today="2026-10-05"
        entries={[
          {
            id: "00000000-0000-4000-8000-000000000002",
            kind: "deposit",
            amount_cents: 50_000,
            occurred_on: "2026-10-03",
            note: null,
            is_opening: false,
          },
          {
            id: "00000000-0000-4000-8000-000000000003",
            kind: "withdrawal",
            amount_cents: 30_000,
            occurred_on: "2026-08-20",
            note: "Passaporte",
            is_opening: false,
          },
        ]}
      />
    </div>
  );
}

function Samples() {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-1">
        {textTokens.map(([className, label]) => (
          <li key={className} className={className}>
            {label}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <Button key={variant} variant={variant} size="lg">
            <PlusIcon aria-hidden="true" />
            {variant}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function DevUiPage() {
  if (!process.env.DEV_UI) notFound();

  return (
    <main id="conteudo" className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <h1 className="text-title1 font-bold tracking-tight">
        Galeria de componentes
      </h1>
      <section aria-labelledby="sobre-fundo" className="flex flex-col gap-3">
        <h2 id="sobre-fundo" className="text-headline font-semibold">
          Sobre o fundo
        </h2>
        <Samples />
        <TransactionSearch
          filters={{ ...noFilters, categoryId: market.id }}
          month="2026-10"
          categories={[market, food, rides]}
          cards={[]}
        />
      </section>
      <section aria-labelledby="analises" className="flex flex-col gap-3">
        <h2 id="analises" className="text-headline font-semibold">
          Análises
        </h2>
        <AnalyticsSamples />
      </section>
      <section aria-labelledby="cofrinhos" className="flex flex-col gap-3">
        <h2 id="cofrinhos" className="text-headline font-semibold">
          Cofrinhos
        </h2>
        <JarSamples />
      </section>
      <section
        aria-labelledby="sobre-card"
        className="flex flex-col gap-3 rounded-2xl bg-card p-4"
      >
        <h2 id="sobre-card" className="text-headline font-semibold">
          Sobre o card
        </h2>
        <Samples />
      </section>
      <section
        aria-labelledby="sobre-popover"
        className="flex flex-col gap-3 rounded-2xl bg-popover p-4 text-popover-foreground"
      >
        <h2 id="sobre-popover" className="text-headline font-semibold">
          Sobre avisos
        </h2>
        <Samples />
      </section>
    </main>
  );
}
