/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_API_URL?: string;

  readonly VITE_API_URL?: string;

  readonly VITE_CLUB_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
