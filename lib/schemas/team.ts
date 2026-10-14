import { z } from "zod";
import { ptBR } from "zod/locales";
import { credentials } from "@/lib/credentials";
import { m } from "@/lib/i18n";
import { Constants } from "@/lib/supabase/database.types";

z.config({ ...ptBR(), jitless: true });

const personName = z
  .string()
  .trim()
  .min(1, m.team.nameRequired)
  .max(80)
  .regex(/^[^\p{Cc}]*$/u);

const role = z.enum(Constants.public.Enums.unit_role);

export const inviteKinds = ["teacher", "unitAdmin", "adminGeral"] as const;

export type InviteKind = (typeof inviteKinds)[number];

export const inviteInput = z
  .object({
    id: z.uuid(),
    name: personName,
    kind: z.enum(inviteKinds),
    unitId: z.union([z.literal(""), z.uuid()]),
  })
  .refine((value) => value.kind === "adminGeral" || value.unitId !== "", {
    message: m.team.unitRequired,
    path: ["unitId"],
  });

export type InviteInput = z.infer<typeof inviteInput>;

export const membershipInput = z.object({
  userId: z.uuid(),
  unitId: z.uuid(m.team.unitRequired),
  role,
});

export type MembershipInput = z.infer<typeof membershipInput>;

export const unitInput = z.object({
  id: z.uuid(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,6}$/, m.units.codeInvalid),
  name: z
    .string()
    .trim()
    .min(1, m.settings.nameRequired)
    .max(80)
    .regex(/^[^\p{Cc}]*$/u),
});

export type UnitInput = z.infer<typeof unitInput>;

export const acceptInviteInput = credentials.extend({ name: personName });

export type AcceptInviteInput = z.infer<typeof acceptInviteInput>;
