// CSRF defense for state-changing requests (POST, PUT, PATCH, DELETE).
// SameSite=Lax cookies already block most cross-site requests; this check is the second layer.
// A request passes when its Origin header matches the host it was sent to.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSameOrigin(request: Request) {
  if (SAFE_METHODS.has(request.method)) return true;

  const origin = request.headers.get("origin");
  // Browsers always send Origin on cross-site POST/PUT/PATCH/DELETE, so a missing header is rejected.
  if (!origin) return false;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
