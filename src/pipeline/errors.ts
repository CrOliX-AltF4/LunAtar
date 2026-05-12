const RETRIABLE_PATTERNS = [
  /rate.?limit/i,
  /429/,
  /timeout/i,
  /ECONNREFUSED/,
  /ETIMEDOUT/,
  /ENOTFOUND/,
  /service.?unavailable/i,
  /503/,
  /overloaded/i,
];

export function isRetriableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return RETRIABLE_PATTERNS.some((pattern) => pattern.test(message));
}
