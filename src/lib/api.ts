const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000/api/v1";

const ACCESS_KEY = "portal_ebd_access_token";
const REFRESH_KEY = "portal_ebd_refresh_token";
const USER_EMAIL_KEY = "portal_ebd_user_email";
const ORG_KEY_FALLBACK = "portal_ebd_org_id";

let contextHydrated = false;

function orgStorageKey() {
  const email = localStorage.getItem(USER_EMAIL_KEY);
  return email ? `${ORG_KEY_FALLBACK}_${email}` : ORG_KEY_FALLBACK;
}

export class UnauthorizedError extends Error {
  constructor(message = "Não autenticado") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function parseApiErrorBody(text: string): { detail: string; code?: string } {
  try {
    const json = JSON.parse(text) as { detail?: string; code?: string };
    if (json && typeof json === "object") {
      return {
        detail: typeof json.detail === "string" ? json.detail : text || "Erro na requisição",
        code: json.code,
      };
    }
  } catch {
    // texto bruto
  }
  return { detail: text || "Erro na requisição" };
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

export function getSessionUserEmail() {
  return localStorage.getItem(USER_EMAIL_KEY);
}

export function setSessionUserEmail(email: string) {
  localStorage.setItem(USER_EMAIL_KEY, email.trim().toLowerCase());
}

export function resetContextHydration() {
  contextHydrated = false;
}

export function clearSession() {
  const orgKey = orgStorageKey();
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(orgKey);
  localStorage.removeItem(USER_EMAIL_KEY);
  resetContextHydration();
  window.dispatchEvent(new Event("portal-ebd:session-cleared"));
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
  setSessionUserEmail(email);
  resetContextHydration();
  const orgKey = orgStorageKey();
  localStorage.removeItem(orgKey);
  await hydrateOrganizationContext(true);
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

export function getActiveOrganizationId() {
  return localStorage.getItem(orgStorageKey());
}

export function setActiveOrganizationId(orgId: string) {
  localStorage.setItem(orgStorageKey(), orgId);
  window.dispatchEvent(new Event("portal-ebd:org-changed"));
}

/** Persiste contexto no navegador e no usuário (API); atualiza todo o sistema. */
export async function switchOrganizationContext(organizationId: string | number) {
  const id = String(organizationId);
  setActiveOrganizationId(id);
  await updateActiveContext(Number(organizationId));
  contextHydrated = true;
}

export async function updateActiveContext(organizationId: number) {
  return request("/me/context", {
    method: "PATCH",
    body: JSON.stringify({ organization_id: organizationId }),
  }, { ensureOrganization: false });
}

function isIgrejaOperacional(tipo: string) {
  const t = tipo?.toUpperCase() ?? "";
  return t === "IGREJA" || t === "FILIAL" || t === "CONGREGACAO";
}

/** Escolhe igreja operacional para professor/secretário de igreja. */
function pickOperationalOrganizationId(me: {
  papeis?: string[];
  papeis_detalhados?: Array<{ nome?: string; organization_id?: number | null }>;
  organizacao_ativa?: { id?: number } | null;
  organizacoes_disponiveis?: Array<{ id?: number; tipo?: string }>;
}) {
  const papeis = (me.papeis ?? []).map((p) => p.trim().toUpperCase());
  const disponiveis = Array.isArray(me.organizacoes_disponiveis) ? me.organizacoes_disponiveis : [];
  const igrejas = disponiveis.filter((o) => isIgrejaOperacional(o.tipo ?? ""));

  if (papeis.includes("PROFESSOR")) {
    const papelProfessor = (me.papeis_detalhados ?? []).find(
      (p) => p.nome?.toUpperCase() === "PROFESSOR" && p.organization_id,
    );
    if (papelProfessor?.organization_id) {
      return papelProfessor.organization_id;
    }
  }

  if (me.organizacao_ativa?.id && disponiveis.some((o) => o.id === me.organizacao_ativa?.id)) {
    return me.organizacao_ativa.id;
  }

  if (igrejas.length === 1) {
    return igrejas[0].id ?? null;
  }

  return null;
}

/** Restaura contexto salvo (local + servidor) uma vez por sessão de página. */
export async function hydrateOrganizationContext(force = false) {
  if (contextHydrated && !force) {
    return;
  }

  try {
    const me = await request<any>(
      "/me",
      { method: "GET" },
      { ensureOrganization: false, skipOrganizationHeader: true },
    );

    const disponiveis = Array.isArray(me.organizacoes_disponiveis) ? me.organizacoes_disponiveis : [];
    const disponivelIds = new Set(disponiveis.map((o: { id: number }) => String(o.id)));
    let stored = getActiveOrganizationId();

    if (stored && !disponivelIds.has(stored)) {
      localStorage.removeItem(orgStorageKey());
      stored = null;
    }

    const preferredId = pickOperationalOrganizationId(me);
    const storedNum = stored ? Number(stored) : null;

    if (preferredId != null) {
      const mustSync = storedNum !== preferredId;
      setActiveOrganizationId(String(preferredId));
      if (mustSync) {
        await updateActiveContext(preferredId);
      }
      contextHydrated = true;
      return;
    }

    if (stored) {
      try {
        await updateActiveContext(Number(stored));
        contextHydrated = true;
        return;
      } catch {
        localStorage.removeItem(orgStorageKey());
      }
    }

    if (disponiveis.length === 1 && disponiveis[0].id != null) {
      await switchOrganizationContext(disponiveis[0].id);
      contextHydrated = true;
      return;
    }
  } catch {
    const stored = getActiveOrganizationId();
    if (stored) {
      try {
        await updateActiveContext(Number(stored));
      } catch {
        localStorage.removeItem(orgStorageKey());
      }
    }
  }

  contextHydrated = true;
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
  options: { ensureOrganization?: boolean; skipOrganizationHeader?: boolean } = {},
): Promise<T> {
  let access = getAccessToken();
  if (!access) {
    throw new UnauthorizedError();
  }

  if (options.ensureOrganization !== false) {
    await hydrateOrganizationContext();
  }

  const orgId = getActiveOrganizationId();

  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${access}`);
  if (orgId && !options.skipOrganizationHeader) {
    headers.set("X-Organization-Id", orgId);
  }

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
    const { detail, code } = parseApiErrorBody(text);
    if (code === "ORGANIZACAO_INATIVA") {
      window.dispatchEvent(new Event("portal-ebd:org-inactive"));
    }
    throw new ApiError(detail || `Erro HTTP ${response.status}`, response.status, code);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
