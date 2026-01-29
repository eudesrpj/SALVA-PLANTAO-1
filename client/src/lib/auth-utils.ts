// client/src/lib/auth-utils.ts
export function redirectToLogin(nextPath?: string) {
  const next =
    nextPath ??
    (typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/");

  const params = new URLSearchParams();
  if (next && next !== "/login") params.set("next", next);

  window.location.href = `/login${params.toString() ? `?${params}` : ""}`;
}

export async function logoutAndRedirect() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // se falhar, ainda assim força redirect
  } finally {
    window.location.href = "/login";
  }
}
