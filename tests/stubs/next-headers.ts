// Minimal in-memory stand-in for next/headers cookies() in tests.
const jar = new Map<string, string>();

export async function cookies() {
  return {
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name)! } : undefined,
    set: (name: string, value: string, options?: { maxAge?: number }) => {
      if (options?.maxAge === 0) jar.delete(name);
      else jar.set(name, value);
    },
  };
}

export function resetCookies() {
  jar.clear();
}
