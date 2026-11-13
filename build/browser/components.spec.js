import { execFileSync } from 'node:child_process';
import { resolve, sep } from 'node:path';
import { test as base, expect } from '@playwright/test';
import { build } from 'vite';
import { HERO_BACKGROUND } from '../../src/js/animations/hero-background.js';

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

test('mobile hero background follows the first card entry and restores on return and cleanup', async ({
    page,
}) => {
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
    await page.evaluate(() => {
        window.destroyComponents();
        const hero = document.createElement('section');
        hero.className = 'hero';
        hero.style.height = '2200px';
        hero.innerHTML = `
            <div class="hero__bg"><div class="hero__bg-image"></div></div>
            <div style="height:1100px"></div>
            <div class="glass__grid-item" style="height:200px">Metric</div>`;
        document.querySelector('main').prepend(hero);
        window.mountComponents();
    });
    const background = page.locator('.hero__bg-image');
    const size = () =>
        background.evaluate((element) => parseFloat(getComputedStyle(element).backgroundSize));
    const position = () =>
        background.evaluate((element) => parseFloat(getComputedStyle(element).backgroundPositionX));
    const initialX = await position();
    const initialSize = await size();
    const targetSize = parseFloat(HERO_BACKGROUND.targetSize);
    const width = (await background.boundingBox()).width;
    const threshold = await page.locator('.hero .glass__grid-item').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return window.scrollY + rect.top - window.innerHeight;
    });
    await page.evaluate((y) => window.scrollTo(0, y), threshold - 5);
    await expect.poll(size).toBe(127);
    await page.evaluate((y) => window.scrollTo(0, y), threshold + 100);
    await expect.poll(size).toBeCloseTo((initialSize + targetSize) / 2, 1);
    await page.evaluate((y) => window.scrollTo(0, y), threshold + 205);
    await expect.poll(size).toBe(150);
    const expectedX =
        initialX - (width * (targetSize - initialSize) * HERO_BACKGROUND.horizontalAnchor) / 100;
    await expect.poll(position).toBeCloseTo(expectedX, 1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(size).toBe(127);
    await expect.poll(position).toBeCloseTo(initialX, 1);
    await page.evaluate((y) => window.scrollTo(0, y), threshold + 205);
    await expect.poll(size).toBe(150);
    await page.setViewportSize({ width: 767, height: 844 });
    await expect.poll(size).toBe(127);
    expect(await background.evaluate((element) => element.style.backgroundSize)).toBe('');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(size).toBe(127);
    await page.evaluate(() => {
        const card = document.querySelector('.hero .glass__grid-item');
        const rect = card.getBoundingClientRect();
        window.scrollTo(0, window.scrollY + rect.bottom - window.innerHeight + 20);
    });
    await expect.poll(size).toBe(150);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(size).toBe(127);
    await page.evaluate(() => window.destroyComponents());
    expect(await background.evaluate((element) => element.style.backgroundSize)).toBe('');
});

test('mobile header hides the outer CTA before JavaScript initializes', async ({ page }) => {
    await page.route('http://frame.test/components.js', (route) =>
        route.fulfill({ contentType: 'text/javascript', body: '' }),
    );
    await page.goto('http://frame.test/');
    await expect(page.locator('.menu > .menu-project')).toBeHidden();
    await expect(page.locator('.header__logo')).toBeVisible();
    await expect(page.locator('.menu-body')).toHaveJSProperty('inert', true);
    expect(await page.evaluate(() => typeof window.mountComponents)).toBe('undefined');
});

test('application remount releases observers, corners and overlay locks', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.evaluate(() => {
        const NativeObserver = window.ResizeObserver;
        window.activeObservers = new Map();
        window.ResizeObserver = class extends NativeObserver {
            observe(...args) {
                if (!window.activeObservers.has(this)) window.activeObservers.set(this, new Set());
                window.activeObservers.get(this).add(args[0]);
                super.observe(...args);
            }
            unobserve(element) {
                const targets = window.activeObservers.get(this);
                targets?.delete(element);
                if (!targets?.size) window.activeObservers.delete(this);
                super.unobserve(element);
            }
            disconnect() {
                window.activeObservers.delete(this);
                super.disconnect();
            }
        };
        window.mountComponents();
    });
    const logo = page.locator('.header__logo');
    await expect.poll(() => logo.evaluate((element) => element.style.clipPath)).toContain('path(');
    await page.setViewportSize({ width: 767, height: 900 });
    await expect.poll(() => logo.evaluate((element) => element.style.clipPath)).toBe('');
    await page.setViewportSize({ width: 768, height: 900 });
    await expect.poll(() => logo.evaluate((element) => element.style.clipPath)).toContain('path(');
    await page.locator('.menu-toggle').click();
    await expect(page.locator('body')).toHaveClass(/_noscroll/);
    await page.evaluate(() => {
        window.destroyComponents();
        window.destroyComponents();
    });
    await expect.poll(() => page.evaluate(() => window.activeObservers.size)).toBe(0);
    await expect.poll(() => logo.evaluate((element) => element.style.clipPath)).toBe('');
    await expect(page.locator('body')).not.toHaveClass(/_noscroll/);
    await page.evaluate(() => window.mountComponents());
    await page.locator('.menu-toggle').click();
    await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
});

test('production bundle boots and keeps dialogs keyboard accessible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://frame.test/?production');

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
    await expect(popup).toHaveJSProperty('inert', true);
    await expect(page.locator('body')).toHaveClass(/_noscroll/);
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/_noscroll/);
});

test('responsive navigation and project pagination work after tab and viewport changes', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const slider = page.locator('.why .swiper');
    for (const [width, slidesPerView] of [
        [390, 'auto'],
        [768, 2],
        [1440, 3],
    ]) {
        await page.setViewportSize({ width, height: 900 });
        await expect
            .poll(() => slider.evaluate((element) => element.swiper.params.slidesPerView))
            .toBe(slidesPerView);
        await page.locator('.why .next').click();
        await expect.poll(() => slider.evaluate((element) => element.swiper.activeIndex)).toBe(1);
        await page.locator('.why .prev').click();
        await expect.poll(() => slider.evaluate((element) => element.swiper.activeIndex)).toBe(0);
        for (let index = 1; index <= 3; index++) {
            await page.locator('.deals .next').click();
            await expect(page.locator('.deals-slide').nth(index)).toHaveClass(/active/);
            await expect(page.locator('.deals-media').nth(index)).toHaveClass(/active/);
        }
        await expect(page.locator('.deals .next')).toBeDisabled();
        for (let index = 0; index < 3; index++) await page.locator('.deals .prev').click();
        await expect(page.locator('.deals .prev')).toBeDisabled();
    }
    await page.locator('[data-tab="2"]').click();
    const project = page.locator('[data-tab-content="2"] .swiper');
    await project.locator('.swiper-pagination-bullet').nth(1).click();
    await expect.poll(() => project.evaluate((element) => element.swiper.activeIndex)).toBe(1);
    await expect.poll(() => project.evaluate((element) => element.swiper.width)).toBeGreaterThan(0);
});

test('responsive deals preserve geometry and keep first and last cards reachable', async ({
    page,
}, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => {
        window.destroyComponents();
        const main = document.querySelector('main');
        main.replaceChildren(main.querySelector('.deals'));
        main.style.padding = '0';
        document.querySelector('.header').style.display = 'none';
        window.mountComponents();
    });
    const section = page.locator('.deals');
    const sectionHeights = new Map();
    for (const [width, height] of [
        [1920, 1080],
        [1920, 1600],
        [1440, 900],
        [1440, 1200],
        [1280, 800],
        [1025, 768],
    ]) {
        await page.setViewportSize({ width, height });
        await section.scrollIntoViewIfNeeded();
        await page.evaluate(() => document.fonts.ready);
        const widths = await section
            .locator('.deals-slide')
            .evaluateAll((slides) => slides.map((slide) => slide.getBoundingClientRect().width));
        for (let index = 0; index < 4; index++) {
            if (index > 0) await section.locator('.next').click();
            await expect(section.locator('.deals-slide').nth(index)).toHaveClass(/active/);
            const geometry = await section.evaluate((element) => {
                const nav = element.querySelector('.swiper-navigation').getBoundingClientRect();
                const viewport = element.querySelector('.deals-viewport').getBoundingClientRect();
                const cards = [...element.querySelectorAll('.deals-slide')].map((card) => {
                    const rect = card.getBoundingClientRect();
                    return {
                        width: rect.width,
                        left: rect.left,
                        right: rect.right,
                        bottom: rect.bottom,
                    };
                });
                return {
                    cards,
                    navTop: nav.top,
                    navBottom: nav.bottom,
                    sectionBottom: element.getBoundingClientRect().bottom,
                    gap: nav.top - viewport.bottom,
                    expectedGap:
                        parseFloat(
                            getComputedStyle(element).getPropertyValue('--deals-navigation-gap'),
                        ) * parseFloat(getComputedStyle(document.documentElement).fontSize),
                    transform: getComputedStyle(element.querySelector('.deals-track')).transform,
                    imageHeight: element
                        .querySelector('.deals-collection__wrap')
                        .getBoundingClientRect().height,
                    minimumImageHeight:
                        (window.innerWidth > 1440 ? 56 : 33) *
                        parseFloat(getComputedStyle(document.documentElement).fontSize),
                };
            });
            expect(geometry.gap).toBeCloseTo(geometry.expectedGap, 0);
            expect(geometry.imageHeight).toBeGreaterThanOrEqual(geometry.minimumImageHeight);
            expect(geometry.navBottom).toBeLessThanOrEqual(geometry.sectionBottom);
            geometry.cards.forEach((card, cardIndex) => {
                expect(card.width).toBeCloseTo(widths[cardIndex], 0);
                if (cardIndex === index) {
                    expect(card.left).toBeGreaterThanOrEqual(0);
                    expect(card.right).toBeLessThanOrEqual(width + 1);
                }
                expect(card.bottom).toBeLessThanOrEqual(geometry.navTop - geometry.expectedGap + 1);
            });
        }
        const sectionHeight = await section.evaluate(
            (element) => element.getBoundingClientRect().height,
        );
        if (sectionHeights.has(width)) {
            // A taller viewport must not reintroduce empty space around the artwork.
            expect(sectionHeight).toBeCloseTo(sectionHeights.get(width), 0);
        } else {
            sectionHeights.set(width, sectionHeight);
        }
        for (let back = 0; back < 3; back++) await section.locator('.prev').click();
        await section.screenshot({ path: testInfo.outputPath(`deals-${width}.png`) });
    }

    for (const width of [1024, 768, 767, 360]) {
        await page.setViewportSize({ width, height: 900 });
        for (let index = 0; index < 3; index++) {
            if (await section.locator('.prev').isEnabled()) await section.locator('.prev').click();
        }
        for (let index = 1; index < 4; index++) await section.locator('.next').click();
        await expect(section.locator('.deals-slide').last()).toHaveClass(/active/);
        const geometry = await section.evaluate((element) => {
            const slides = [...element.querySelectorAll('.deals-slide')];
            const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
            return {
                widths: slides.map((slide) => slide.getBoundingClientRect().width),
                last: slides.at(-1).getBoundingClientRect().right,
                minimum: 32 * rem,
            };
        });
        expect(geometry.last).toBeLessThanOrEqual(width + 1);
        if (width > 767) {
            geometry.widths.forEach((cardWidth) =>
                expect(cardWidth).toBeGreaterThanOrEqual(geometry.minimum - 1),
            );
        }
        expect(
            await section
                .locator('.deals-slide')
                .last()
                .evaluate((slide) => getComputedStyle(slide).position),
        ).toBe(width > 767 ? 'absolute' : 'static');
        expect(
            await section
                .locator('.deals-track')
                .evaluate((track) => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41),
        ).toBeLessThan(0);
        for (let index = 0; index < 3; index++) await section.locator('.prev').click();
        expect(
            await section
                .locator('.deals-slide')
                .first()
                .evaluate((slide) => slide.getBoundingClientRect().left),
        ).toBeGreaterThanOrEqual(0);
    }
});

test('desktop deals preserve geometry while animated requests are queued', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const section = page.locator('.deals');
    const before = await section
        .locator('.deals-slide')
        .evaluateAll((slides) =>
            slides.map((slide) => ({ width: slide.offsetWidth, left: slide.offsetLeft })),
        );
    for (let index = 0; index < 3; index++) await section.locator('.next').click();
    await expect(section.locator('.deals-slide').last()).toHaveClass(/active/);
    await expect
        .poll(() =>
            section
                .locator('.deals-media')
                .last()
                .evaluate((image) => getComputedStyle(image).clipPath),
        )
        .toBe('inset(0%)');
    const after = await section
        .locator('.deals-slide')
        .evaluateAll((slides) =>
            slides.map((slide) => ({ width: slide.offsetWidth, left: slide.offsetLeft })),
        );
    expect(after.map((card) => card.width)).toEqual(before.map((card) => card.width));
    expect(after[1].left).toBeLessThan(before[1].left);
    await expect(section.locator('.next')).toBeDisabled();
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

for (const width of [390, 1100, 1280, 1281, 1439, 1440, 1441, 1600, 1780]) {
    test(`menu opens and closes without empty GSAP targets at width ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => window.mountComponents());
        const toggle = page.locator('.menu-toggle');
        if (width <= 1440) await expect(toggle.locator('span')).toBeHidden();
        else await expect(toggle.locator('span')).toBeVisible();
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('.menu-body')).toHaveJSProperty('inert', false);
        await page.keyboard.press('Escape');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toBeFocused();
        await expect(page.locator('body')).not.toHaveClass(/_noscroll/);
        if (width <= 1440) await expect(toggle.locator('span')).toBeHidden();
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await page.locator('main').dispatchEvent('click');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator('.menu-body')).toHaveJSProperty('inert', true);
        await expect(page.locator('body')).not.toHaveClass(/_noscroll/);
    });
}

for (const classes of ['header-page', 'header-page dark-static']) {
    test(`header without Hero keeps CTA hidden at the top (${classes})`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.setViewportSize({ width: 1600, height: 900 });
        await page.evaluate((classes) => {
            window.destroyComponents();
            document.querySelector('.header').className = 'header ' + classes;
            window.mountComponents();
        }, classes);
        const project = page.locator('.menu-project');
        await expect(project).toHaveJSProperty('inert', true);
        await expect(project).toBeHidden();
        for (const y of [99, 100, 101, 0]) {
            await page.evaluate((y) => window.scrollTo(0, y), y);
            await expect(project).toHaveJSProperty('inert', true);
        }
        await page.locator('.menu-toggle').click();
        await expect(project).toHaveJSProperty('inert', false);
        await expect(project).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(project).toBeHidden();
    });
}

for (const width of [1440, 1600]) {
    test('hero CTA and inner-page header at width ' + width, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => {
            window.destroyComponents();
            const hero = document.createElement('div');
            hero.className = 'hero';
            hero.innerHTML =
                '<div class="hero__content"><div class="hero__button"><button class="_btn">Contact</button></div></div>';
            document.querySelector('main').prepend(hero);
            document.querySelector('.header').classList.add('header-page');
            window.mountComponents();
        });
        const header = page.locator('.header');
        const hero = page.locator('.hero__button');
        await expect(header).not.toHaveClass(/header-small/);
        if (width === 1440) {
            await expect(hero).toBeVisible();
            await page.locator('.menu-toggle').click();
            await expect(hero).toBeHidden();
            await expect(hero).toHaveJSProperty('inert', true);
            await expect(page.locator('.menu-project')).toHaveJSProperty('inert', false);
            await page.keyboard.press('Escape');
            await expect(hero).toBeVisible();
        } else {
            await expect(hero).toBeHidden();
            await page.evaluate(() => window.scrollTo(0, 100));
            await expect(header).toHaveClass(/header-small/);
            await expect(page.locator('.menu-toggle span')).toBeHidden();
            await page.locator('.menu-toggle').click();
            await expect(page.locator('.menu-project')).toHaveJSProperty('inert', false);
            await page.keyboard.press('Escape');
            await expect(page.locator('.menu-project')).toHaveJSProperty('inert', true);
            await page.evaluate(() => window.scrollTo(0, 0));
            await expect(header).not.toHaveClass(/header-small/);
        }
    });
}

test('header compaction and CTA follow the scroll threshold and menu state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.evaluate(() => {
        window.destroyComponents();
        const section = document.createElement('section');
        section.className = 'hero';
        section.style.cssText =
            'position:absolute;top:1200px;height:100vh;width:1px;pointer-events:none';
        document.body.append(section);
        window.mountComponents();
    });
    const header = page.locator('.header');
    const menu = page.locator('.menu');
    const label = page.locator('.menu-toggle span');
    await expect(header).not.toHaveClass(/header-small/);
    await expect(label).toBeVisible();
    const logo = await page.locator('.header__logo').boundingBox();
    await page.evaluate(() => window.scrollTo(0, 99));
    await expect(header).not.toHaveClass(/header-small/);
    await page.evaluate(() => window.scrollTo(0, 100));
    await expect(header).toHaveClass(/header-small/);
    expect((await page.locator('.header__logo').boundingBox()).width).toBe(logo.width);
    await expect(label).toBeHidden();
    const square = await menu.boundingBox();
    expect(Math.abs(square.width - square.height)).toBeLessThan(1);
    await page.locator('.menu-toggle').click();
    await expect(label).toBeVisible();
    expect((await label.boundingBox()).x).toBeCloseTo(
        (await page.locator('.menu-toggle').boundingBox()).x,
        0,
    );
    expect((await menu.boundingBox()).width).toBeGreaterThan(square.width * 3);
    await page.locator('main').dispatchEvent('click');
    await expect(label).toBeHidden();
    await page.setViewportSize({ width: 1780, height: 900 });
    await expect(header).not.toHaveClass(/header-small/);
    await expect(label).toBeVisible();

    // Start the CTA phase without the compact-header marker or prior focus/scroll state.
    await page.goto('http://frame.test/');
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.evaluate(() => {
        window.destroyComponents();
        const content = document.createElement('div');
        content.className = 'hero';
        content.style.cssText =
            'position:absolute;top:1200px;height:100px;width:1px;pointer-events:none';
        document.body.append(content);
        window.mountComponents();
    });
    const project = page.locator('.menu-project');
    await expect(project).toHaveJSProperty('inert', false);
    const threshold = 100;
    await page.evaluate((y) => window.scrollTo(0, y), threshold - 1);
    await expect(page.locator('.header')).not.toHaveClass(/header-scrolled/);
    await page.evaluate((y) => window.scrollTo(0, y), threshold);
    await expect(project).toHaveJSProperty('inert', true);
    await page.evaluate(() => window.scrollTo(0, 1400));
    await expect(project).toHaveJSProperty('inert', true);
    await page.locator('.menu-toggle').click();
    await expect(project).toHaveJSProperty('inert', false);
    await page.keyboard.press('Escape');
    await expect(project).toHaveJSProperty('inert', true);
    await page.evaluate((y) => window.scrollTo(0, y), threshold - 1);
    await expect(project).toHaveJSProperty('inert', false);
});

test('header compaction animates and can be interrupted by opening or returning to the start', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.evaluate(() => {
        window.destroyComponents();
        const section = document.createElement('section');
        section.id = 'header-threshold-test';
        section.className = 'hero';
        section.style.cssText =
            'position:absolute;top:2000px;height:100vh;width:1px;pointer-events:none';
        document.body.append(section);
        window.mountComponents();
    });
    const menu = page.locator('.menu');
    const initialWidth = (await menu.boundingBox()).width;
    expect((await page.locator('.menu-toggle span').boundingBox()).x).toBeCloseTo(
        (await page.locator('.menu-toggle').boundingBox()).x,
        0,
    );
    const intermediateWidth = await page.evaluate((initialWidth) => {
        window.scrollTo(0, 100);
        window.dispatchEvent(new Event('scroll'));
        return new Promise((resolve) => {
            const interrupt = () => {
                const width = document.querySelector('.menu').getBoundingClientRect().width;
                if (
                    document.querySelector('.header').classList.contains('header-small') &&
                    width < initialWidth - 5
                ) {
                    // Measure and interrupt in one frame, before another browser round trip.
                    document.querySelector('.menu-toggle').click();
                    resolve(width);
                } else {
                    requestAnimationFrame(interrupt);
                }
            };
            requestAnimationFrame(interrupt);
        });
    }, initialWidth);
    expect(intermediateWidth).toBeLessThan(initialWidth - 5);
    expect(intermediateWidth).toBeGreaterThan(70);
    await expect.poll(async () => (await menu.boundingBox()).width).toBeCloseTo(initialWidth, 0);
    await expect(page.locator('.menu-toggle span')).toBeVisible();
    await page.locator('main').dispatchEvent('click');
    await page.evaluate(() => {
        window.scrollTo(0, 0);
        window.dispatchEvent(new Event('scroll'));
    });
    await expect(page.locator('.header')).not.toHaveClass(/header-small/);
    await expect.poll(async () => (await menu.boundingBox()).width).toBeCloseTo(initialWidth, 0);
    await expect(page.locator('.menu-toggle span')).toBeVisible();
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
