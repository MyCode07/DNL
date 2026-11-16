import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, expect } from '@playwright/test';
import { build } from 'vite';

let script;
const bootstrap = readFileSync('template-parts/page-transition.php', 'utf8').match(
    /<script>([\s\S]*?)<\/script>/,
)[1];

test.beforeAll(async () => {
    const result = await build({
        configFile: false,
        logLevel: 'error',
        build: {
            write: false,
            lib: {
                entry: resolve('src/js/animations/page-transition.js'),
                name: 'PageTransition',
                formats: ['iife'],
            },
        },
    });
    script = result[0].output.find((file) => file.type === 'chunk').code;
});

test('page transition releases loaded content and completes internal navigation', async ({
    page,
}) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.route('http://transition.test/**', (route) =>
        route.fulfill({
            contentType: 'text/html',
            body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script>${bootstrap}</script></head><body style="height:3000px;background:red"></body></html>`,
        }),
    );
    await page.goto('http://transition.test/');
    const opacity = () =>
        page.evaluate(() => {
            const canvas = document.querySelector('[data-page-transition]');
            const context = canvas.getContext('2d');
            return context.getImageData(canvas.width - 1, canvas.height - 1, 1, 1).data[3];
        });
    expect(await opacity()).toBe(255);
    await page.evaluate(() => {
        Object.defineProperty(document.fonts, 'ready', {
            value: new Promise((resolve) => {
                window.releaseFonts = resolve;
            }),
        });
    });
    await page.addScriptTag({ content: script });
    await page.evaluate(() => {
        window.destroyTransition = window.PageTransition.initPageTransition(document);
    });
    await expect(page.locator('[data-page-transition]')).toHaveCount(1);
    await page.evaluate(() => window.releaseFonts());
    await expect(page.locator('[data-page-transition]')).toHaveCount(0);
    const outgoing = await page.evaluate(() => {
        const link = document.createElement('a');
        link.href = '/about/';
        document.body.append(link);
        link.click();
        const canvas = document.querySelector('[data-page-transition]');
        return Boolean(canvas);
    });
    expect(outgoing).toBe(true);
    await page.waitForURL('http://transition.test/about/');
    expect(await opacity()).toBe(255);
    expect(errors).toEqual([]);
});
