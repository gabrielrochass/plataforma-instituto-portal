try {
  process.loadEnvFile(".env.local");
} catch {}

export const e2eEmail = "e2e@financial-tracker.local";
