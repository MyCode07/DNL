import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('HTML sitemap renders page titles, translated homepages, taxonomy and archive names with original URLs', (t) => {
    const php = spawnSync('php', ['--version'], { encoding: 'utf8', windowsHide: true });
    if (php.error?.code === 'ENOENT' && !process.env.CI) return t.skip('PHP CLI is unavailable');
    assert.equal(php.status, 0, 'PHP CLI is required in CI');
    const fixture = fileURLToPath(new URL('./fixtures/html-sitemap.php', import.meta.url));
    const source = fileURLToPath(new URL('../../inc/seo/sitemap.php', import.meta.url));
    const result = spawnSync('php', [fixture, source], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stderr, '');
    const links = [...result.stdout.matchAll(/<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g)].map(
        ([, url, title]) => [url, title],
    );
    assert.deepEqual(links, [
        ['https://example.test/', 'Главная'],
        ['https://example.test/blog/', 'Блог'],
        ['https://example.test/en/', 'Home'],
        ['https://example.test/en/blog/', 'Blog'],
        ['https://example.test/category/news/', 'News &amp; analysis'],
        ['https://example.test/article/', 'Рынок &amp; инвестиции'],
        ['https://example.test/second/', 'Second page'],
        ['https://example.test/author/editor/', 'Editor'],
        ['https://example.test/books/', 'Books'],
    ]);
    const sections = [
        ...result.stdout.matchAll(
            /<section>\s*<h2\b[^>]*>([^<]+)<\/h2>\s*<ul>(.*?)<\/ul>\s*<\/section>/gs,
        ),
    ];
    assert.deepEqual(
        sections.map(([, title]) => title),
        ['Страницы', 'Категории', 'Публикации', 'Авторы', 'Books'],
    );
    assert.match(sections[0][2], /href="https:\/\/example.test\/"/);
    assert.doesNotMatch(sections[2][2], /href="https:\/\/example.test\/"/);
    assert.match(sections[0][2], /href="https:\/\/example.test\/blog\/"/);
    assert.match(sections[0][2], /href="https:\/\/example.test\/en\/blog\/"/);
    assert.doesNotMatch(sections[2][2], /\/blog\//);
    assert.match(
        result.stdout,
        /<link rel="stylesheet" href="https:\/\/example.test\/wp-content\/themes\/frame\/dist\/css\/style.min.css">/,
    );
});
