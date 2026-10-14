const prefix = "portal:";

export function badgePayload(token: string) {
  return `${prefix}${token}`;
}

export function badgeTokenOf(payload: string) {
  const match = /^portal:([2-9A-HJ-NP-Z]{10})$/.exec(payload.trim());
  return match ? match[1] : null;
}
