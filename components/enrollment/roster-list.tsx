"use client";

import {
  AccessibilityIcon,
  ArrowRightLeftIcon,
  EllipsisVerticalIcon,
  LogOutIcon,
  UserRoundIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PersonAvatar } from "@/components/app-shell/person-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { m } from "@/lib/i18n";
import {
  EndEnrollmentDialog,
  TransferDialog,
  type TransferTarget,
} from "./enrollment-dialogs";

export type RosterRow = {
  enrollmentId: string;
  studentId: string;
  name: string;
  detail: string;
  accessibility: boolean;
};

const itemClass = "min-h-11 px-3 text-body";

export function RosterList({
  rows,
  targets,
  editable,
}: {
  rows: readonly RosterRow[];
  targets: readonly TransferTarget[];
  editable: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{
    kind: "transfer" | "end";
    row: RosterRow;
  } | null>(null);

  return (
    <>
      <ul className="divide-y overflow-hidden rounded-2xl bg-card">
        {rows.map((row) => (
          <li
            key={row.enrollmentId}
            className="flex min-h-15 items-center gap-3 px-4 py-2"
          >
            <PersonAvatar name={row.name} />
            <Link
              href={`/alunos/${row.studentId}` as Route}
              className="flex min-w-0 flex-1 flex-col py-1"
            >
              <span className="text-body font-medium">{row.name}</span>
              <span className="flex flex-wrap items-center gap-x-2 text-footnote text-muted-foreground">
                {row.detail}
                {row.accessibility && (
                  <span className="inline-flex items-center gap-1 text-link">
                    <AccessibilityIcon aria-hidden="true" className="size-4" />
                    {m.students.accessibility}
                  </span>
                )}
              </span>
            </Link>
            {editable && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      aria-label={m.enrollment.actions(row.name)}
                    />
                  }
                >
                  <EllipsisVerticalIcon aria-hidden="true" className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  <DropdownMenuItem
                    className={itemClass}
                    onClick={() =>
                      router.push(`/alunos/${row.studentId}` as Route)
                    }
                  >
                    <UserRoundIcon aria-hidden="true" />
                    {m.enrollment.openProfile}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={itemClass}
                    onClick={() => setDialog({ kind: "transfer", row })}
                  >
                    <ArrowRightLeftIcon aria-hidden="true" />
                    {m.enrollment.transfer}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    className={itemClass}
                    onClick={() => setDialog({ kind: "end", row })}
                  >
                    <LogOutIcon aria-hidden="true" />
                    {m.enrollment.end}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </li>
        ))}
      </ul>
      {dialog?.kind === "transfer" && (
        <TransferDialog
          enrollmentId={dialog.row.enrollmentId}
          name={dialog.row.name}
          targets={targets}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
      {dialog?.kind === "end" && (
        <EndEnrollmentDialog
          enrollmentId={dialog.row.enrollmentId}
          name={dialog.row.name}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
    </>
  );
}
