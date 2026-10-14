import type { VariantProps } from "class-variance-authority";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NewEntryLink({
  className,
  size = "lg",
  children,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> &
  Pick<VariantProps<typeof buttonVariants>, "size">) {
  return (
    <Link
      href="/lancamentos/novo"
      className={cn(buttonVariants({ size }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}
