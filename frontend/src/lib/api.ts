import { FCONNECT_API_URL, REQUEST_TIMEOUT_MS, SITE_API_URL } from '../config/env';
import { AuthTokens, TokenStore, fconnectTokens, siteTokens } from './tokens';

export type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get fullMessage(): string {
    return this.details.length > 0 ? `${this.message} : ${this.details.join(', ')}` : this.message;
  }
}

export interface ApiClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
  del<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
  upload<T>(path: string, file: File, field?: string): Promise<T>;
  tokens: TokenStore;
}

interface ClientOptions {
  baseUrl: string;
  tokens: TokenStore;
  refreshPath: string;
}

const createApiClient = ({ baseUrl, tokens, refreshPath }: ClientOptions): ApiClient => {
  const buildUrl = (path: string, query?: Record<string, QueryValue>): string => {
    const url = new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '') continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  };

  let refreshInFlight: Promise<string | null> | null = null;

  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = tokens.getRefresh();
    if (!refreshToken) return null;

    const response = await fetch(buildUrl(refreshPath), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      tokens.clear();
      return null;
    }

    const payload = (await response.json()) as { data?: { tokens?: AuthTokens } };
    const fresh = payload.data?.tokens;
    if (!fresh?.access_token) {
      tokens.clear();
      return null;
    }

    tokens.set(fresh);
    return fresh.access_token;
  };

  const ensureFreshToken = (): Promise<string | null> => {
    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  };

  const readError = async (response: Response): Promise<ApiError> => {
    let message = `Erreur ${response.status}`;
    let details: string[] = [];
    try {
      const payload = (await response.json()) as { message?: string; errors?: string[] };
      if (payload.message) message = payload.message;
      if (Array.isArray(payload.errors)) details = payload.errors;
    } catch {
      message = `Erreur ${response.status}`;
    }
    return new ApiError(response.status, message, details);
  };

  const send = async (
    path: string,
    options: RequestOptions,
    token: string | null
  ): Promise<Response> => {
    const headers: Record<string, string> = {};

    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const relayAbort = () => controller.abort();
    options.signal?.addEventListener('abort', relayAbort);

    try {
      return await fetch(buildUrl(path, options.query), {
        method: options.method ?? 'GET',
        headers,
        body: options.formData ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', relayAbort);
    }
  };

  const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const useAuth = options.auth ?? false;
    let token = useAuth ? tokens.getAccess() : null;

    let response: Response;
    try {
      response = await send(path, options, token);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(0, 'La requête a expiré ou a été annulée.');
      }
      throw new ApiError(0, 'Serveur injoignable. Vérifiez votre connexion.');
    }

    if (response.status === 401 && useAuth && token) {
      token = await ensureFreshToken();
      if (token) {
        try {
          response = await send(path, options, token);
        } catch {
          throw new ApiError(0, 'Serveur injoignable. Vérifiez votre connexion.');
        }
      } else {
        tokens.clear();
      }
    }

    if (!response.ok) throw await readError(response);
    if (response.status === 204) return undefined as T;

    return (await response.json()) as T;
  };

  return {
    request,
    tokens,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    del: (path, options) => request(path, { ...options, method: 'DELETE' }),
    upload: (path, file, field = 'file') => {
      const formData = new FormData();
      formData.append(field, file);
      return request(path, { method: 'POST', formData, auth: true });
    },
  };
};

export const siteApi = createApiClient({
  baseUrl: SITE_API_URL,
  tokens: siteTokens,
  refreshPath: '/auth/refresh',
});

export const fconnectApi = createApiClient({
  baseUrl: FCONNECT_API_URL,
  tokens: fconnectTokens,
  refreshPath: '/auth/refresh',
});
