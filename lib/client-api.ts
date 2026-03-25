/**
 * Browser fetch helpers — always send cookies so auth APIs work.
 */

export type ApiError = { error: string };

export async function apiJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    const msg =
      typeof (data as ApiError).error === "string"
        ? (data as ApiError).error
        : res.statusText;
    throw new Error(msg || "Request failed");
  }
  return data as T;
}

/** POST multipart/form-data (e.g. file upload). Do not set Content-Type — browser adds boundary. */
export async function apiForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    const msg =
      typeof (data as ApiError).error === "string"
        ? (data as ApiError).error
        : res.statusText;
    throw new Error(msg || "Request failed");
  }
  return data as T;
}
