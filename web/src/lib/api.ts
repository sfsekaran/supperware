const API_BASE = '';

// Token getter injected by auth store to avoid circular deps
let getToken: () => string | null = () => null;
export function setTokenGetter(fn: () => string | null) {
  getToken = fn;
}

let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; headers: Headers }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401) {
    onUnauthorized();
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.error ?? body.errors?.join(', ') ?? `HTTP ${response.status}`;
    throw new ApiError(response.status, message);
  }

  const data: T = response.status === 204 ? (null as T) : await response.json();
  return { data, headers: response.headers };
}

export const api = {
  get:    <T>(path: string)                => request<T>(path),
  post:   <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string)                => request<T>(path, { method: 'DELETE' }),
};
