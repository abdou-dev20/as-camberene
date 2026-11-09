export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

export interface TokenStore {
  getAccess(): string | null;
  getRefresh(): string | null;
  set(tokens: AuthTokens): void;
  clear(): void;
}

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null): void => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    return;
  }
};

export const createTokenStore = (prefix: string): TokenStore => {
  const accessKey = `${prefix}_access_token`;
  const refreshKey = `${prefix}_refresh_token`;

  return {
    getAccess: () => read(accessKey),
    getRefresh: () => read(refreshKey),
    set: (tokens) => {
      write(accessKey, tokens.access_token);
      write(refreshKey, tokens.refresh_token);
    },
    clear: () => {
      write(accessKey, null);
      write(refreshKey, null);
    },
  };
};

export const siteTokens = createTokenStore('asc_camberene_site');

export const fconnectTokens = createTokenStore('asc_camberene_fconnect');
