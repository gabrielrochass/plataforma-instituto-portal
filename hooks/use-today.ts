import { useSyncExternalStore } from "react";
import { localToday, todayInSaoPaulo } from "@/lib/dates";

const subscribe = () => () => {};

export function useToday() {
  return useSyncExternalStore(subscribe, localToday, todayInSaoPaulo);
}
