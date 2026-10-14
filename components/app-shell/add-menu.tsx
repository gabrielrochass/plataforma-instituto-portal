"use client";

import {
  BookOpenIcon,
  ClipboardCheckIcon,
  type LucideIcon,
  MegaphoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UserPlusIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AddOption } from "./nav-items";

const options: Record<
  AddOption,
  { href: Route; label: string; hint: string; icon: LucideIcon }
> = {
  attendance: {
    href: "/chamada",
    label: m.add.attendance,
    hint: m.add.attendanceHint,
    icon: ClipboardCheckIcon,
  },
  student: {
    href: "/alunos/novo",
    label: m.add.student,
    hint: m.add.studentHint,
    icon: UserPlusIcon,
  },
  class: {
    href: "/turmas/nova",
    label: m.add.class,
    hint: m.add.classHint,
    icon: BookOpenIcon,
  },
  teacher: {
    href: "/equipe/convidar?papel=professor" as Route,
    label: m.add.teacher,
    hint: m.add.teacherHint,
    icon: UserRoundPlusIcon,
  },
  unitAdmin: {
    href: "/equipe/convidar?papel=adm-unidade" as Route,
    label: m.add.unitAdmin,
    hint: m.add.unitAdminHint,
    icon: ShieldIcon,
  },
  adminGeral: {
    href: "/equipe/convidar?papel=adm-geral" as Route,
    label: m.add.adminGeral,
    hint: m.add.adminGeralHint,
    icon: ShieldCheckIcon,
  },
  announcement: {
    href: "/avisos/novo",
    label: m.add.announcement,
    hint: m.add.announcementHint,
    icon: MegaphoneIcon,
  },
};

export function AddMenu({
  items,
  compact = false,
  className,
}: {
  items: readonly AddOption[];
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            size={compact ? "icon-lg" : "lg"}
            aria-label={compact ? m.add.open : undefined}
            data-tour="acao"
            className={className}
          />
        }
      >
        <PlusIcon aria-hidden="true" className={cn(compact && "size-6")} />
        {!compact && m.add.open}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-4 sm:rounded-2xl"
      >
        <SheetHeader>
          <SheetTitle className="text-title3 font-semibold">
            {m.add.title}
          </SheetTitle>
        </SheetHeader>
        <ul className="grid gap-2 px-4 sm:grid-cols-2">
          {items.map((key) => {
            const option = options[key];
            const Icon = option.icon;
            return (
              <li key={key}>
                <Link
                  href={option.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-16 items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-border transition-colors hover:bg-muted/60"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-body font-semibold">
                      {option.label}
                    </span>
                    <span className="text-footnote text-muted-foreground">
                      {option.hint}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
