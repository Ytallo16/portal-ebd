const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000/api/v1";

const ACCESS_KEY = "portal_ebd_access_token";
const REFRESH_KEY = "portal_ebd_refresh_token";
const ORG_KEY = "portal_ebd_org_id";

export class UnauthorizedError extends Error {
  constructor(message = "Não autenticado") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function url(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ORG_KEY);
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

async function refreshToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  const response = await fetch(url("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearSession();
    return false;
  }

  const data = await response.json();
  setTokens(data.access, data.refresh ?? refresh);
  return true;
}

export async function loginWithCredentials(email: string, password: string) {
  const response = await fetch(url("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new UnauthorizedError("Credenciais inválidas");
  }

  const data = await response.json();
  setTokens(data.access, data.refresh);
  localStorage.removeItem(ORG_KEY);
}

export async function logoutFromApi() {
  const access = getAccessToken();
  if (!access) {
    clearSession();
    return;
  }

  try {
    await fetch(url("/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    });
  } finally {
    clearSession();
  }
}

async function ensureOrgId() {
  if (localStorage.getItem(ORG_KEY)) {
    return;
  }

  const response = await request("/organizations/", { method: "GET" }, { ensureOrganization: false });
  const organizations = getResults<{ id: number }>(response);
  if (organizations.length > 0) {
    localStorage.setItem(ORG_KEY, String(organizations[0].id));
  }
}

export function getResults<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (typeof data === "object" && data && "results" in data && Array.isArray((data as { results: unknown[] }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

export async function request<T = unknown>(
  path: string,
  init: RequestInit = {},
  options: { ensureOrganization?: boolean } = {},
): Promise<T> {
  let access = getAccessToken();
  if (!access) {
    throw new UnauthorizedError();
  }

  if (options.ensureOrganization !== false) {
    await ensureOrgId();
  }

  const orgId = localStorage.getItem(ORG_KEY);

  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${access}`);
  if (orgId) headers.set("X-Organization-Id", orgId);

  let response = await fetch(url(path), { ...init, headers });

  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (!refreshed) {
      throw new UnauthorizedError();
    }

    access = getAccessToken();
    if (!access) throw new UnauthorizedError();
    headers.set("Authorization", `Bearer ${access}`);
    response = await fetch(url(path), { ...init, headers });
  }

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Erro HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
