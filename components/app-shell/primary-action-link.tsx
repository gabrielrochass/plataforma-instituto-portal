import type { VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PrimaryAction = { href: Route; label: string; icon: LucideIcon };

export function PrimaryActionLink({
  action,
  className,
  size = "lg",
  compact = false,
}: {
  action: PrimaryAction;
  className?: string;
  compact?: boolean;
} & Pick<VariantProps<typeof buttonVariants>, "size">) {
  const Icon = action.icon;
  return (
    <Link
      href={action.href}
      aria-label={compact ? action.label : undefined}
      data-tour="acao"
      className={cn(buttonVariants({ size }), className)}
    >
      <Icon aria-hidden="true" className={compact ? "size-6" : undefined} />
      {!compact && action.label}
    </Link>
  );
}
