import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import path from "path";
import { loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
) as { version: string };

// Load environment variables (including .env.local)
const env = loadEnv("", process.cwd(), "");

// Brand configuration
const BRAND = env.VITE_BRAND ?? "default";
const ASSET_PREFIX = BRAND === "default" ? "" : `brand/${BRAND}/`;

// Plugin that rewrites favicon/touch-icon hrefs in index.html to use the brand path
const brandFaviconPlugin = {
  name: "brand-favicon-transform",
  transformIndexHtml(html: string) {
    if (BRAND === "default") return html;
    return html
      .replace(/href="\/favicon\.ico"/g, `href="/${ASSET_PREFIX}favicon.ico"`)
      .replace(/href="\/favicon\.png"/g, `href="/${ASSET_PREFIX}favicon.png"`)
      .replace(
        /href="\/pwa-192x192\.png"/g,
        `href="/${ASSET_PREFIX}pwa-192x192.png"`,
      );
  },
};

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-jazz": ["jazz-tools", "jazz-tools/react"],
          "vendor-ui": [
            "lucide-react",
            "@base-ui/react",
            "class-variance-authority",
            "clsx",
          ],
          "vendor-icons": ["react-icons"],
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    brandFaviconPlugin,
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        `${ASSET_PREFIX}favicon.ico`,
        `${ASSET_PREFIX}apple-touch-icon.png`,
      ],
      manifest: {
        name: "Torneo Round Robin",
        short_name: "Torneo Round Robin",
        description: "Gestión de torneos de ajedrez round robin",
        theme_color: "#3b5bdb",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: `${ASSET_PREFIX}pwa-192x192.png`,
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: `${ASSET_PREFIX}pwa-512x512.png`,
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: `${ASSET_PREFIX}pwa-512x512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,woff2}"],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "external-cache" },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/domain/**", "src/lib/**"],
      exclude: ["src/domain/__tests__/**", "src/lib/__tests__/**"],
      reporter: ["text", "html"],
    },
  },
});
