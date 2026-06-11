/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /** "false" fuerza OpenStreetMap aunque haya API key */
  readonly VITE_USE_GOOGLE_MAPS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
