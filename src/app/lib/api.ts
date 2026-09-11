export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include" // ✅ HERE (and now it applies to all requests)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const rawError = (data as any)?.error;
    const message =
      typeof rawError === "string"
        ? rawError
        : typeof rawError?.message === "string"
          ? rawError.message
          : rawError
            ? JSON.stringify(rawError)
            : "Request failed";
    throw new Error(message);
  }
  return data as T;
}
