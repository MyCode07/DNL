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

test('mobile transition covers the viewport before loading and after viewport changes', async ({
    page,
}) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 390, height: 660 });
    await page.route('http://transition.test/**', (route) =>
        route.fulfill({
            contentType: 'text/html',
            body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script>${bootstrap}</script></head><body style="height:3000px;background:red"></body></html>`,
        }),
    );
    await page.goto('http://transition.test/');
    const coverage = () =>
        page.evaluate(() => {
            const canvas = document.querySelector('[data-page-transition]');
            const rect = canvas.getBoundingClientRect();
            const context = canvas.getContext('2d');
            return {
                top: rect.top,
                bottom: rect.bottom,
                viewport: window.innerHeight,
                alpha: context.getImageData(canvas.width - 1, canvas.height - 1, 1, 1).data[3],
            };
        });
    expect(await coverage()).toMatchObject({ top: 0, bottom: 660, alpha: 255 });
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
    for (const size of [
        { width: 390, height: 844 },
        { width: 390, height: 660 },
        { width: 844, height: 390 },
    ]) {
        await page.setViewportSize(size);
        await page.evaluate(() => window.scrollTo(0, 200));
        await expect.poll(coverage).toMatchObject({
            top: 0,
            bottom: size.height,
            alpha: 255,
        });
    }
    await page.evaluate(() => window.releaseFonts());
    await expect(page.locator('[data-page-transition]')).toHaveCount(0);
    const outgoing = await page.evaluate(() => {
        const link = document.createElement('a');
        link.href = '/about/';
        document.body.append(link);
        link.click();
        const canvas = document.querySelector('[data-page-transition]');
        const rect = canvas.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: canvas.height };
    });
    expect(outgoing).toMatchObject({ top: 0, bottom: 390 });
    expect(outgoing.height).toBeGreaterThanOrEqual(390);
    await page.waitForURL('http://transition.test/about/');
    expect(await coverage()).toMatchObject({ top: 0, bottom: 390, alpha: 255 });
    expect(errors).toEqual([]);
});
