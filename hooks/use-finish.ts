import type { Route } from "next";
import { useRouter } from "next/navigation";
import { canGoBack } from "./use-go-back";

export function useFinish(fallback: Route) {
  const router = useRouter();
  return () => {
    if (canGoBack()) {
      router.back();
      router.refresh();
    } else {
      router.replace(fallback);
    }
  };
}
