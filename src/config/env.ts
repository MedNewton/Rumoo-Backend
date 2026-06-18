function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        "Set it in Railway Variables and redeploy the service."
    );
  }

  return value;
}

function normalizeMultilineSecret(value: string): string {
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\\n/g, "\n");
}

export function getFirebaseEnv() {
  return {
    projectId: requiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: normalizeMultilineSecret(requiredEnv("FIREBASE_PRIVATE_KEY")),
  };
}

export function getResendEnv() {
  return {
    apiKey: requiredEnv("RESEND_API_KEY"),
    fromEmail: process.env.RESEND_FROM_EMAIL?.trim() || "noreply@rumoo.app",
  };
}
