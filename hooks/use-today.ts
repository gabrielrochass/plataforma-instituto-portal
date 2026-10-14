import { useSyncExternalStore } from "react";
import { localToday, todayInRecife } from "@/lib/dates";

const subscribe = () => () => {};

export function useToday() {
  return useSyncExternalStore(subscribe, localToday, todayInRecife);
}
