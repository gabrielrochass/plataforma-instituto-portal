"use client";

import { ChevronLeftIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { canGoBack } from "@/hooks/use-go-back";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BackLink({
  href,
  label = m.common.back,
  mobileOnly = false,
}: {
  href: Route;
  label?: string;
  mobileOnly?: boolean;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(event) => {
        if (!canGoBack()) return;
        event.preventDefault();
        router.back();
      }}
      className={cn(
        "-ml-1 flex w-fit min-h-11 items-center gap-0.5 text-body text-link",
        mobileOnly && "md:hidden",
      )}
    >
      <ChevronLeftIcon aria-hidden="true" className="size-5" />
      {label}
    </Link>
  );
}
