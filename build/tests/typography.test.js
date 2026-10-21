import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import * as sass from 'sass';

const loadPaths = [fileURLToPath(new URL('../../src/scss', import.meta.url))];
const reference = JSON.parse(readFileSync(new URL('./fixtures/typography.json', import.meta.url)));
const compile = (source) => sass.compileString(source, { loadPaths }).css;
const generated = compile('@use "typography" as type; @include type.generate();');

function declarations(css, selector, width) {
    const result = {};
    postcss.parse(css).walkRules((rule) => {
        if (!rule.selectors.includes(selector)) return;
        for (let parent = rule.parent; parent; parent = parent.parent) {
            if (parent.type === 'atrule' && parent.name === 'media') {
                const max = parent.params.match(/max-width:\s*(\d+)px/);
                if (max && width > Number(max[1])) return;
            }
        }
        rule.walkDecls(({ prop, value }) => {
            result[prop] = value;
        });
    });
    return result;
}

// Independent snapshot of the original font-processing.scss, including repeated values.
test('all original classes and heading tags retain every property at breakpoint boundaries', () => {
    for (const width of [360, 767, 768, 1024, 1025, 1280, 1281, 1920, 2560]) {
        for (const [name, { selectors, steps }] of Object.entries(reference)) {
            let expected = { ...steps.base };
            for (const breakpoint of [1280, 1024, 767]) {
                if (width <= breakpoint) expected = { ...expected, ...steps[breakpoint] };
            }
            for (const selector of selectors.split(/,\s*/)) {
                assert.deepEqual(
                    declarations(generated, selector, width),
                    expected,
                    `${name} at ${width}px`,
                );
            }
        }
    }
});

test('class generation emits one query per breakpoint and only changed properties', () => {
    const root = postcss.parse(generated);
    const queries = [];
    root.walkAtRules('media', ({ params }) => queries.push(params));
    assert.deepEqual(queries, ['(max-width: 1280px)', '(max-width: 1024px)', '(max-width: 767px)']);
    const mobile = root.nodes.find((node) => node.params === '(max-width: 767px)');
    for (const selector of ['.text-m', '.text-s']) {
        const rule = mobile.nodes.find((node) => node.selectors.includes(selector));
        assert.deepEqual(
            rule.nodes.map(({ prop }) => prop),
            ['line-height'],
        );
    }
    assert(
        root.nodes.some(
            (node) =>
                node.type === 'rule' &&
                node.selectors.includes('.h1-subtitle') &&
                node.selectors.includes('.h4'),
        ),
    );
});

test('mixins emit no global classes, support property selection, and skip empty queries', () => {
    assert.equal(compile('@use "typography";'), '');
    const css = compile(
        '@use "typography" as type; .upload { @include type.typography("primary-button", $properties: (line-height,)); }',
    );
    assert.deepEqual(declarations(css, '.upload', 360), { 'line-height': '1.4rem' });
    assert.equal(postcss.parse(css).nodes.filter((node) => node.type === 'atrule').length, 2);
    assert(!css.includes('.primary-button'));
    assert.throws(
        () => compile('@use "typography" as type; .x { @include type.typography("missing"); }'),
        /Unknown typography style/,
    );
});

test('font weight, family and transform can change independently at any breakpoint', () => {
    const css = compile(`
        @use "typography/tokens" with ($styles: (
            "custom": (
                base: (font-size: 2rem, line-height: 3rem, letter-spacing: 0, font-weight: 400, font-family: serif, text-transform: none),
                1280: (font-size: 2rem, line-height: 2.8rem),
                1024: (font-weight: 700, font-family: sans-serif),
                767: (letter-spacing: -0.02rem, text-transform: uppercase),
            ),
        ));
        @use "typography" as type;
        .custom { @include type.typography("custom"); }
    `);
    assert.deepEqual(declarations(css, '.custom', 360), {
        'font-size': '2rem',
        'line-height': '2.8rem',
        'letter-spacing': '-0.02rem',
        'font-weight': '700',
        'font-family': 'sans-serif',
        'text-transform': 'uppercase',
    });
    const root = postcss.parse(css);
    const tablet = root.nodes.find((node) => node.params === '(max-width: 1280px)');
    assert.deepEqual(
        tablet.nodes[0].nodes.map(({ prop }) => prop),
        ['line-height'],
    );
});

test('aliases share class rules instead of repeating declarations', () => {
    const css = compile(
        '@use "typography" as type; @include type.generate(("text-m": ".article figcaption"));',
    );
    assert.deepEqual(
        declarations(css, '.article figcaption', 767),
        declarations(css, '.text-m', 767),
    );
    postcss.parse(css).walkRules((rule) => {
        if (rule.selectors.includes('.article figcaption'))
            assert(rule.selectors.includes('.text-m'));
    });
});
