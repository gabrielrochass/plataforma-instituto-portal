"use client";

import Link from "next/link";
import { useGoBack } from "@/hooks/use-go-back";

export function BackLink({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const goBack = useGoBack("/entrar");

  return (
    <Link
      href="/entrar"
      className={className}
      onNavigate={(event) => {
        event.preventDefault();
        goBack();
      }}
    >
      {children}
    </Link>
  );
}
