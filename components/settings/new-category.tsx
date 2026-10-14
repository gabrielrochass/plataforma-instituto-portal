"use client";

import { useState } from "react";
import { QuickCreate } from "@/components/forms/quick-create";
import { createCategory } from "@/lib/actions";
import { m } from "@/lib/i18n";
import type { Enums } from "@/lib/supabase/database.types";

export function NewCategory({ kind }: { kind: Enums<"transaction_kind"> }) {
  const [status, setStatus] = useState("");

  return (
    <>
      <QuickCreate
        label={m.settings.newCategory[kind]}
        placeholder={m.settings.newCategoryPlaceholder[kind]}
        onCreate={async (name) => {
          const result = await createCategory({
            id: crypto.randomUUID(),
            kind,
            name,
          });
          if (result.ok) setStatus(m.settings.categoryCreated(name.trim()));
          return result;
        }}
      />
      <output className="sr-only">{status}</output>
    </>
  );
}
