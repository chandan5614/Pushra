import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 60_000,
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: true,
    cwd: __dirname,
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
}

export default config
