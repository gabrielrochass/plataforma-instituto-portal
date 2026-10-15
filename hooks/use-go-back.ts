import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useRef } from "react";

type WithNavigation = { navigation?: { canGoBack: boolean } };

export function canGoBack() {
  const { navigation } = window as WithNavigation;
  return navigation ? navigation.canGoBack : window.history.length > 1;
}

export function useGoBack(fallback: Route) {
  const router = useRouter();
  const left = useRef(false);
  return () => {
    if (left.current) return;
    left.current = true;
    if (canGoBack()) router.back();
    else router.replace(fallback);
  };
}
