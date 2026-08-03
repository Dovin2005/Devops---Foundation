// Fail loudly at boot instead of silently running production traffic on a
// well-known dev secret (checked into every service's env.ts as a fallback
// so local dev works without a .env file).
export function assertNotDefaultInProd(varName: string, value: string, insecureDefault: string): void {
  if (value === insecureDefault) {
    throw new Error(
      `Refusing to start in production with ${varName} unset or equal to its insecure dev default. ` +
      `Set a real ${varName} in the environment.`
    );
  }
}
