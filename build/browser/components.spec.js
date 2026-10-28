import { execFileSync } from 'node:child_process';
import { resolve, sep } from 'node:path';
import { test as base, expect } from '@playwright/test';
import { build } from 'vite';

let html;
let script;
const dist = resolve('dist');
const test = base.extend({
    diagnostics: [
        async ({ page }, use) => {
            const messages = [];
            page.on('pageerror', (error) => messages.push(error.message));
            page.on('console', (message) => {
                if (['error', 'warning'].includes(message.type())) messages.push(message.text());
            });
            page.on('requestfailed', (request) => messages.push(request.failure().errorText));
            await use(messages);
            expect(messages, 'Unexpected browser errors or warnings').toEqual([]);
        },
        { auto: true },
    ],
});

test.beforeAll(async () => {
    html = execFileSync('php', ['build/browser/fixtures/page.php'], { encoding: 'utf8' });
    const result = await build({
        configFile: false,
        logLevel: 'error',
        build: {
            write: false,
            lib: {
                entry: resolve('build/browser/fixtures/entry.js'),
                name: 'Components',
                formats: ['iife'],
            },
        },
    });
    script = result[0].output.find((file) => file.type === 'chunk').code;
});

test.beforeEach(async ({ page }) => {
    // Requests are served in-process: no dev server, database or external site.
    await page.route('http://frame.test/**', async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: html });
        if (pathname === '/components.js')
            return route.fulfill({ contentType: 'text/javascript', body: script });
        const file = resolve(`.${pathname}`);
        if (file.startsWith(dist + sep)) {
            try {
                return await route.fulfill({ path: file });
            } catch {
                /* Missing resources must fail the test through browser diagnostics. */
            }
        }
        return route.fulfill({ status: 404, body: 'Not found' });
    });
    await page.goto('http://frame.test/');
    await expect.poll(() => page.evaluate(() => typeof window.mountComponents)).toBe('function');
});

test('every PHP-rendered project has its own description and retains state across tabs', async ({
    page,
}) => {
    const ids = await page
        .locator('.projects-item__description')
        .evaluateAll((items) => items.map((item) => item.id));
    expect(new Set(ids).size).toBe(3);
    for (let project = 1; project <= 3; project++) {
        await page.locator(`[data-tab="${project}"]`).click();
        const panel = page.locator(`[data-tab-content="${project}"]`);
        const toggle = panel.locator('.projects-item__description-toggle');
        const description = panel.locator('.projects-item__description');
        await expect(toggle).toHaveAttribute('aria-controls', await description.getAttribute('id'));
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect
            .poll(() => description.evaluate((item) => item.getBoundingClientRect().height))
            .toBeGreaterThan(0);
        await expect(description).toHaveJSProperty('inert', false);
    }
    await page.locator('[data-tab="1"]').click();
    const toggle = page.locator('[data-tab-content="1"] .projects-item__description-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(toggle).toBeHidden();
    await expect(
        page.locator('[data-tab-content="1"] .projects-item__description'),
    ).toHaveJSProperty('inert', false);
});

for (const width of [390, 1100, 1440]) {
    test(`menu opens and closes without empty GSAP targets at width ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => window.mountComponents());
        const toggle = page.locator('.menu-toggle');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('.menu-body')).toHaveJSProperty('inert', false);
        await page.keyboard.press('Escape');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toBeFocused();
        await expect(page.locator('body')).not.toHaveClass(/_noscroll/);
    });
}

test('closing a popup over the mobile menu preserves the menu scroll lock and restores focus', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.menu-toggle').click();
    const opener = page.locator('.menu-body .menu-btn[data-open-popup]');
    await opener.click();
    const popup = page.locator('#popup-1');
    await expect(popup).toHaveClass(/_open/);
    await popup.locator('input').focus();
    await page.keyboard.press('Tab');
    await expect(popup.locator('.popup-close')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(popup).not.toHaveClass(/_open/);
    await expect(opener).toBeFocused();
    await expect(page.locator('body')).toHaveClass(/_noscroll/);
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/_noscroll/);
});

for (const inline of [false, true]) {
    test(`form validates, prevents duplicate submits and shows success (${inline ? 'inline' : 'popup'})`, async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.evaluate(() => {
            window.submissions = 0;
            window.wpcf7 = {
                submit(form) {
                    window.submissions++;
                    return new Promise((resolve) => {
                        window.finishSubmission = () => {
                            form.dispatchEvent(new CustomEvent('wpcf7mailsent', { bubbles: true }));
                            resolve();
                        };
                    });
                },
            };
        });
        if (!inline) {
            await page.locator('.menu-toggle').click();
            await page.locator('.menu-body .menu-btn[data-open-popup]').click();
        }
        const form = page.locator(inline ? '#inline-form form' : '#popup-1 form');
        const submit = form.locator('[type="submit"]');
        await expect(submit).toBeDisabled();
        await form.locator('input').fill('John2');
        await expect(submit).toBeDisabled();
        await form.locator('input').fill('John');
        await expect(submit).toBeEnabled();
        await submit.click();
        await form.evaluate((item) =>
            item.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true })),
        );
        await expect.poll(() => page.evaluate(() => window.submissions)).toBe(1);
        await expect(submit).toBeDisabled();
        await page.evaluate(() => window.finishSubmission());
        const resultPopup = page.locator(inline ? '#contact-form-result' : '#popup-1');
        await expect(resultPopup.locator('[data-popup-result="success"]')).toBeVisible();
        await expect(
            resultPopup.locator('.popup-result--success .popup-result__content'),
        ).toBeFocused();
    });
}

test('rejected CF7 submission recovers and allows retry', async ({ page, diagnostics }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => {
        window.wpcf7 = {
            submit(form) {
                form.dataset.status = 'submitting';
                return Promise.reject(new Error('Test network failure'));
            },
        };
    });
    const form = page.locator('#inline-form form');
    await form.locator('input').fill('John');
    await form.locator('[type="submit"]').click();
    const popup = page.locator('#contact-form-result');
    await expect(popup.locator('[data-popup-result="error"]')).toBeVisible();
    await popup.locator('[data-popup-retry]').click();
    await expect(form.locator('input')).toBeFocused();
    await expect(form.locator('[type="submit"]')).toBeEnabled();
    await expect(form).toHaveAttribute('data-status', 'init');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toContain('Contact Form 7 submission failed');
    expect(diagnostics[0]).toContain('Test network failure');
    diagnostics.length = 0;
});

test('server validation errors stay visible until the field is corrected', async ({ page }) => {
    await page.evaluate(() => {
        window.wpcf7 = {
            submit(form) {
                form.dispatchEvent(
                    new CustomEvent('wpcf7invalid', {
                        bubbles: true,
                        detail: { apiResponse: { invalid_fields: [{ field: 'cname' }] } },
                    }),
                );
                return Promise.resolve();
            },
        };
    });
    const form = page.locator('#inline-form form');
    const name = form.locator('input');
    await name.fill('John');
    await form.locator('[type="submit"]').click();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toBeFocused();
    await expect(form.locator('.wpcf7-not-valid-tip')).toBeVisible();
    await expect(form.locator('[type="submit"]')).toBeDisabled();
    await name.fill('Jane');
    await expect(name).toHaveAttribute('aria-invalid', 'false');
    await expect(form.locator('.wpcf7-not-valid-tip')).toHaveCount(0);
    await expect(form.locator('[type="submit"]')).toBeEnabled();
});
