import {
  CircleAlertIcon,
  CircleCheckIcon,
  PlusIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/app-shell/empty-state";
import { LinkList } from "@/components/app-shell/link-list";
import { PortalMark } from "@/components/brand/portal-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

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
  "link",
] as const;

const badgeVariants = [
  "default",
  "secondary",
  "outline",
  "success",
  "warning",
  "destructive",
] as const;

const textTokens = [
  ["text-foreground", "Texto principal"],
  ["text-muted-foreground", "Texto secundário"],
  ["text-link", "Link"],
  ["text-success", "Presente"],
  ["text-warning", "3 faltas seguidas"],
  ["text-destructive", "Falta"],
] as const;

function Samples({ id }: { id: string }) {
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
      <div className="flex flex-wrap gap-2">
        {badgeVariants.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant === "success" && <CircleCheckIcon aria-hidden="true" />}
            {variant === "warning" && <CircleAlertIcon aria-hidden="true" />}
            {variant}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex min-h-11 items-center gap-3">
          <Checkbox id={`${id}-termo`} defaultChecked />
          <label htmlFor={`${id}-termo`} className="text-body">
            Termo assinado
          </label>
        </div>
        <div className="flex min-h-11 items-center gap-3">
          <Switch id={`${id}-horarios`} defaultChecked />
          <label htmlFor={`${id}-horarios`} className="text-body">
            Horários diferentes por dia
          </label>
        </div>
      </div>
      <label htmlFor={`${id}-nota`} className="flex flex-col gap-2">
        <span className="text-footnote font-medium text-muted-foreground">
          O que foi trabalhado na aula
        </span>
        <Textarea id={`${id}-nota`} defaultValue="Laços de repetição" />
      </label>
    </div>
  );
}

export default function DevUiPage() {
  if (!process.env.DEV_UI) notFound();

  return (
    <main id="conteudo" className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <PortalMark className="size-12" />
        <h1 className="text-title1 font-bold tracking-tight">
          Galeria de componentes
        </h1>
      </div>
      <section aria-labelledby="sobre-fundo" className="flex flex-col gap-3">
        <h2 id="sobre-fundo" className="text-headline font-semibold">
          Sobre o fundo
        </h2>
        <Samples id="fundo" />
        <LinkList
          links={[
            {
              href: "/dev/ui",
              title: "Python Manhã",
              hint: "Boa Viagem, terça e quinta",
              icon: UsersRoundIcon,
              color: "chart-1",
            },
            {
              href: "/dev/ui",
              title: "Maria Souza",
              hint: "16 anos",
              icon: UserRoundIcon,
            },
          ]}
        />
        <EmptyState
          icon={UsersRoundIcon}
          title="Nenhuma turma ainda"
          description="As turmas da sua unidade aparecem aqui."
        />
      </section>
      <section
        aria-labelledby="sobre-card"
        className="flex flex-col gap-3 rounded-2xl bg-card p-4"
      >
        <h2 id="sobre-card" className="text-headline font-semibold">
          Sobre o card
        </h2>
        <Samples id="card" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead className="text-right">Frequência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Maria Souza</TableCell>
              <TableCell className="text-right tabular-nums">92%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>João Lima</TableCell>
              <TableCell className="text-right tabular-nums">68%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
      <section
        aria-labelledby="sobre-popover"
        className="flex flex-col gap-3 rounded-2xl bg-popover p-4 text-popover-foreground"
      >
        <h2 id="sobre-popover" className="text-headline font-semibold">
          Sobre avisos
        </h2>
        <Samples id="popover" />
      </section>
    </main>
  );
}
