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
    html = execFileSync('php', ['build/browser/fixtures/page.php'], {
        encoding: 'utf8',
        windowsHide: true,
    });
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
        const url = new URL(route.request().url());
        const pathname = url.pathname;
        if (pathname === '/')
            return route.fulfill({
                contentType: 'text/html',
                body: url.searchParams.has('production')
                    ? html.replace(
                          '<script src="/components.js"></script>',
                          '<script type="module" src="/dist/js/app.min.js"></script>',
                      )
                    : html,
            });
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
                        detail: {
                            apiResponse: {
                                invalid_fields: [
                                    { field: 'cname', message: 'Custom server validation message' },
                                ],
                            },
                        },
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
    await expect(form.locator('.wpcf7-not-valid-tip')).toHaveText(
        'Custom server validation message',
    );
    await expect(form.locator('[type="submit"]')).toBeDisabled();
    await name.fill('Jane');
    await expect(name).toHaveAttribute('aria-invalid', 'false');
    await expect(form.locator('.wpcf7-not-valid-tip')).toHaveCount(0);
    await expect(form.locator('[type="submit"]')).toBeEnabled();
});

test('client errors use per-form CF7 copy and preserve native accessible errors', async ({
    page,
}) => {
    await page.evaluate(() => {
        const form = document.querySelector('#inline-form form');
        const messages = document.createElement('input');
        messages.type = 'hidden';
        messages.name = '_frame_cf7_messages';
        messages.value = JSON.stringify({ invalid_alphabetic: 'Per-form alphabetic message' });
        form.append(messages);
        window.mountComponents();
    });
    const form = page.locator('#inline-form form');
    await form.locator('input[name="cname"]').fill('123');
    await expect(form.locator('.wpcf7-not-valid-tip')).toHaveText('Per-form alphabetic message');
    await page.evaluate(() => {
        const form = document.querySelector('#inline-form form');
        const tip = form.querySelector('.wpcf7-not-valid-tip');
        tip.removeAttribute('data-contact-form-error');
        tip.textContent = 'Original CF7 message';
        const response = document.createElement('div');
        response.className = 'screen-reader-response';
        response.innerHTML = '<ul><li>Accessible CF7 message</li></ul>';
        form.closest('.wpcf7').append(response);
        form.dispatchEvent(
            new CustomEvent('wpcf7invalid', {
                bubbles: true,
                detail: {
                    apiResponse: {
                        invalid_fields: [{ field: 'cname', message: 'Server message' }],
                    },
                },
            }),
        );
    });
    await expect(form.locator('.wpcf7-not-valid-tip')).toHaveText('Original CF7 message');
    await expect(page.locator('#inline-form .screen-reader-response li')).toHaveText(
        'Accessible CF7 message',
    );
});
