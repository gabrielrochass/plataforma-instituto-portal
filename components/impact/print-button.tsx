"use client";

import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { m } from "@/lib/i18n";

export function PrintButton() {
  return (
    <Button size="lg" onClick={() => window.print()}>
      <PrinterIcon aria-hidden="true" />
      {m.impact.print}
    </Button>
  );
}
