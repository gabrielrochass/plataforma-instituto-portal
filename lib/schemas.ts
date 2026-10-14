import { z } from "zod";
import { ptBR } from "zod/locales";
import { cardDesignKeys } from "@/lib/card-designs";
import { categoryIcons } from "@/lib/category-icons";
import { m } from "@/lib/i18n";
import { paletteColors } from "@/lib/palette";
import { Constants } from "@/lib/supabase/database.types";

z.config(ptBR());

const isoDate = z
  .string()
  .regex(/^(20\d{2}|2100)-\d{2}-\d{2}$/, m.entry.dateInvalid);
const kind = z.enum(Constants.public.Enums.transaction_kind);
const day = z.number().int().min(1).max(31);
const money = z.number().int().min(1).max(9_999_999_999);
const icon = z.enum(Object.keys(categoryIcons) as [string, ...string[]]);
const name = z.string().trim().min(1, m.settings.nameRequired).max(40);

export const transactionInput = z
  .object({
    id: z.uuid(),
    kind,
    amountCents: z
      .number()
      .int()
      .min(1, m.entry.amountRequired)
      .max(9_999_999_999),
    occurredOn: isoDate,
    description: z.string().trim().max(120),
    categoryId: z.uuid(m.entry.categoryRequired),
    paymentKind: z.enum(
      Constants.public.Enums.payment_kind,
      m.entry.paymentRequired,
    ),
    cardId: z.uuid().nullable(),
  })
  .refine((t) => (t.paymentKind === "card") === (t.cardId !== null), {
    message: m.entry.paymentRequired,
    path: ["paymentKind"],
  });

export type TransactionInput = z.infer<typeof transactionInput>;

export const quickCategoryInput = z.object({ id: z.uuid(), kind, name });

export const starterCategoriesInput = z
  .array(z.object({ kind, name, icon, color: z.enum(paletteColors) }))
  .max(20);

export type StarterCategoryInput = z.infer<typeof starterCategoriesInput>;

export const categoryInput = z.object({
  id: z.uuid(),
  name,
  icon,
  color: z.enum(paletteColors),
  monthlyLimitCents: money.nullable(),
});

export type CategoryInput = z.infer<typeof categoryInput>;

export const cardInput = z
  .object({
    id: z.uuid(),
    name,
    design: z.enum(cardDesignKeys),
    bestPurchaseDay: day.nullable(),
    dueDay: day.nullable(),
  })
  .refine(
    (card) => (card.bestPurchaseDay === null) === (card.dueDay === null),
    {
      path: ["bestPurchaseDay"],
    },
  );

export type CardInput = z.infer<typeof cardInput>;

export const jarInput = z.object({
  id: z.uuid(),
  name,
  icon,
  color: z.enum(paletteColors),
  targetCents: money.nullable(),
  targetDate: isoDate.nullable(),
  plannedMonthlyCents: money.nullable(),
  openingCents: money.nullable(),
});

export type JarInput = z.infer<typeof jarInput>;

export const jarEntryInput = z.object({
  id: z.uuid(),
  jarId: z.uuid(),
  kind: z.enum(Constants.public.Enums.jar_entry_kind),
  amountCents: z
    .number()
    .int()
    .min(1, m.entry.amountRequired)
    .max(9_999_999_999),
  occurredOn: isoDate,
  note: z.string().trim().max(120),
  isOpening: z.boolean(),
});

export type JarEntryInput = z.infer<typeof jarEntryInput>;

export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
}
