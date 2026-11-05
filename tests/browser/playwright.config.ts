import { defineConfig } from '@playwright/test';

// NextURL normalizes loopback IPs to localhost. Binding next dev to 127.0.0.1
// makes locale rewrites look external and re-enter middleware. Match origins.
export default defineConfig({
  testDir: '.', testMatch: 'journey.spec.ts', workers: 1, retries: 0, timeout: 30000,
  use: { baseURL: 'http://localhost:3218', headless: true },
  webServer: {
    command: 'npm run dev -- --webpack --hostname localhost --port 3218',
    url: 'http://localhost:3218/free-results',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.test',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture-anon-key',
      NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: '',
    },
  },
  outputDir: '/tmp/aic-journey-browser-results',
});
