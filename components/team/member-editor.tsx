"use client";

import { KeyRoundIcon, UserRoundXIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { ChoiceChips } from "@/components/forms/choice-chips";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import {
  createPasswordReset,
  removeMembership,
  setAdminGeral,
  setMembership,
  setStaffActive,
} from "@/lib/actions/team";
import { attempt, failed } from "@/lib/attempt";
import type { TeamMember } from "@/lib/data/team";
import { m } from "@/lib/i18n";
import type { Unit, UnitRole } from "@/lib/roles";
import { ShareLink } from "./share-link";

export function MemberEditor({
  member,
  units,
  adminUnitIds,
  viewerIsAdminGeral,
  isSelf,
}: {
  member: TeamMember;
  units: readonly Unit[];
  adminUnitIds: readonly string[];
  viewerIsAdminGeral: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [addUnitId, setAddUnitId] = useState("");
  const [addRole, setAddRole] = useState<UnitRole>("teacher");
  const name = member.display_name ?? member.email;
  const unitName = (id: string) =>
    units.find((unit) => unit.id === id)?.name ?? "";
  const canEditRow = (row: { unit_id: string; role: UnitRole }) =>
    adminUnitIds.includes(row.unit_id) &&
    (viewerIsAdminGeral || row.role === "teacher") &&
    !isSelf;
  const canManage = member.manageable;
  const addable = units.filter(
    (unit) =>
      adminUnitIds.includes(unit.id) &&
      !member.memberships.some((row) => row.unit_id === unit.id),
  );

  function run(call: Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const result = await attempt(call, failed);
      toast.add(
        result.ok
          ? { title: success, type: "success" }
          : { title: result.message ?? m.common.tryAgain, type: "error" },
      );
    });
  }

  function reset() {
    startTransition(async () => {
      const result = await attempt(createPasswordReset(member.id), failed);
      if (!result.ok) {
        toast.add({ title: result.message, type: "error" });
        return;
      }
      setResetLink(`${window.location.origin}/redefinir/${result.token}`);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="unidades" className="flex flex-col gap-3">
        <h2 id="unidades" className="px-1 text-title3 font-semibold">
          {m.team.units}
        </h2>
        <ul className="divide-y overflow-hidden rounded-2xl bg-card">
          {member.is_admin_geral && (
            <li className="flex min-h-15 items-center px-4 py-3 text-body">
              {m.roles.adminGeral}
            </li>
          )}
          {member.memberships.map((row) => (
            <li
              key={row.unit_id}
              className="flex min-h-15 items-center justify-between gap-3 px-4 py-3"
            >
              <span className="text-body">
                {m.team.roleIn(m.roles[row.role], unitName(row.unit_id))}
              </span>
              {canEditRow(row) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="text-destructive"
                  disabled={pending}
                  focusableWhenDisabled
                  onClick={() =>
                    run(
                      removeMembership(member.id, row.unit_id),
                      m.team.removed(unitName(row.unit_id)),
                    )
                  }
                >
                  {m.team.remove(unitName(row.unit_id))}
                </Button>
              )}
            </li>
          ))}
          {!member.is_admin_geral && member.memberships.length === 0 && (
            <li className="flex min-h-15 items-center px-4 py-3 text-body text-muted-foreground">
              {m.team.noUnits}
            </li>
          )}
        </ul>
        {!isSelf && addable.length > 0 && (canManage || viewerIsAdminGeral) && (
          <form
            className="flex flex-col gap-3 rounded-2xl bg-card p-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!addUnitId) return;
              run(
                setMembership({
                  userId: member.id,
                  unitId: addUnitId,
                  role: addRole,
                }),
                m.team.added,
              );
              setAddUnitId("");
            }}
          >
            <label
              htmlFor="add-unit"
              className="text-footnote font-medium text-muted-foreground"
            >
              {m.team.addUnit}
            </label>
            <NativeSelect
              id="add-unit"
              value={addUnitId}
              onChange={(event) => setAddUnitId(event.target.value)}
            >
              <option value="">{m.team.unit}</option>
              {addable.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </NativeSelect>
            {viewerIsAdminGeral && (
              <ChoiceChips
                legend={m.team.role}
                name="add-role"
                value={addRole}
                onChange={(value) => setAddRole(value as UnitRole)}
                options={(["teacher", "admin"] as const).map((option) => ({
                  value: option,
                  label: m.roles[option],
                }))}
              />
            )}
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              disabled={pending || !addUnitId}
              focusableWhenDisabled
            >
              {m.team.add}
            </Button>
          </form>
        )}
      </section>

      {viewerIsAdminGeral && (
        <section className="flex min-h-15 items-center justify-between gap-4 rounded-2xl bg-card px-4 py-3">
          <label htmlFor="admin-geral" className="flex flex-col">
            <span className="text-body font-medium">{m.roles.adminGeral}</span>
            <span className="text-footnote text-muted-foreground">
              {m.team.adminGeralHint}
            </span>
          </label>
          <Switch
            id="admin-geral"
            checked={member.is_admin_geral}
            disabled={pending}
            onCheckedChange={(value) =>
              run(setAdminGeral(member.id, value), m.team.saved)
            }
          />
        </section>
      )}

      {!isSelf && (
        <section aria-labelledby="acesso" className="flex flex-col gap-3">
          <h2 id="acesso" className="px-1 text-title3 font-semibold">
            {m.team.access}
          </h2>
          {canManage ? (
            <div className="flex flex-col gap-3">
              {resetLink ? (
                <ShareLink
                  title={m.team.resetReady(name)}
                  hint={m.team.resetHint}
                  link={resetLink}
                  message={m.team.resetMessage(name, resetLink)}
                />
              ) : (
                !member.deactivated_at && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    disabled={pending}
                    focusableWhenDisabled
                    onClick={reset}
                  >
                    <KeyRoundIcon aria-hidden="true" />
                    {m.team.resetLink}
                  </Button>
                )
              )}
              {member.deactivated_at ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  disabled={pending}
                  focusableWhenDisabled
                  onClick={() =>
                    run(setStaffActive(member.id, true), m.team.reactivated)
                  }
                >
                  {m.team.reactivate}
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="destructive" size="lg" />}
                  >
                    <UserRoundXIcon aria-hidden="true" />
                    {m.team.deactivate}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {m.team.deactivateTitle(name)}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {m.team.deactivateText}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel size="lg">
                        {m.common.cancel}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        size="lg"
                        onClick={() =>
                          run(
                            setStaffActive(member.id, false),
                            m.team.deactivatedDone,
                          )
                        }
                      >
                        {m.team.deactivate}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ) : (
            <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
              {m.team.readOnly}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
