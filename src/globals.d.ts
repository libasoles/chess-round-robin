declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_JAZZ_API_KEY: string
  readonly VITE_BRAND?: string
  readonly VITE_BRAND_NAME?: string
  readonly VITE_BRAND_URL?: string
  readonly VITE_BRAND_OG_IMAGE?: string
  readonly VITE_BRAND_DESCRIPTION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
