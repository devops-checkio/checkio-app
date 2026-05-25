function normalizeMessagePart(raw: unknown): string | undefined {
  if (typeof raw === "string") {
    const s = raw.trim();
    return s.length ? s : undefined;
  }
  return undefined;
}

/** Extrae el mensaje legible de respuestas Nest/axios (string o string[]). */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const fromRaw = (rawMax: unknown): string | undefined => {
    const single = normalizeMessagePart(rawMax);
    if (single) return single;
    if (Array.isArray(rawMax)) {
      const parts = rawMax
        .map((x) => normalizeMessagePart(x))
        .filter((x): x is string => Boolean(x));
      if (parts.length) return parts.join(". ");
    }
    return undefined;
  };

  if (error && typeof error === "object" && "response" in error) {
    const r = error as { response?: { data?: { message?: unknown } } };
    const fromBody = fromRaw(r.response?.data?.message);
    if (fromBody) return fromBody;
  }
  if (error && typeof error === "object" && "message" in error) {
    const fromErr = fromRaw((error as { message?: unknown }).message);
    if (fromErr) return fromErr;
  }
  return fallback;
}
