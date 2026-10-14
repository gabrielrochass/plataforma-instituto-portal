import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function isTokenShape(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
