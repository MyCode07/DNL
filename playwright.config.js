import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './build/browser',
    testMatch: '**/*.spec.js',
    forbidOnly: Boolean(process.env.CI),
    workers: 1,
    timeout: 30_000,
    use: {
        browserName: 'chromium',
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
        viewport: { width: 390, height: 844 },
        trace: 'retain-on-failure',
    },
});
