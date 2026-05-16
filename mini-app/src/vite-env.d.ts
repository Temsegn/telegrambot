/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  Telegram?: {
    WebApp: {
      ready: () => void;
      expand: () => void;
      initDataUnsafe: {
        user?: {
          id: number;
          username?: string;
          first_name?: string;
          last_name?: string;
        };
      };
    };
  };
}
