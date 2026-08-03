// Retries a boot-time operation (e.g. the initial DB connection) with linear
// backoff. Startup-only — request-path code should fail fast, not retry.
export async function retryAsync(
  fn: () => Promise<void>,
  options: { attempts?: number; delayMs?: number; onRetry?: (err: unknown, attempt: number) => void } = {}
): Promise<void> {
  const { attempts = 5, delayMs = 1000, onRetry } = options;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await fn();
      return;
    } catch (err) {
      if (attempt === attempts) throw err;
      onRetry?.(err, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}
