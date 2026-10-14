"use server";

import { cookies } from "next/headers";
import { type Theme, themeCookie } from "@/lib/theme";

export async function saveTheme(theme: Theme) {
  (await cookies()).set(themeCookie, theme === "dark" ? "dark" : "light", {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
  });
}
