import assert from 'node:assert/strict';
import test from 'node:test';
import postcss from 'postcss';
import { groupMediaQueriesPlugin } from '../plugins/group-media-queries.js';

const process = async (css) =>
    (await postcss([groupMediaQueriesPlugin()]).process(css, { from: undefined })).root;

test('adjacent identical media queries merge without duplicating or reordering declarations', async () => {
    const root = await process(
        '@media (max-width: 767px) {.a {color:red}} @media (max-width: 767px) {.b {color:blue}} @media (max-width: 767px) {.c {color:green}}',
    );
    assert.equal(root.nodes.length, 1);
    assert.deepEqual(
        root.nodes[0].nodes.map(({ selector }) => selector),
        ['.a', '.b', '.c'],
    );
});

test('media queries never move across base rules or different breakpoints', async () => {
    const css =
        '@media (max-width: 767px) {.a {font-size:14px}} .a {font-size:20px} @media (max-width: 767px) {.a {line-height:16px}} @media (max-width: 1024px) {.a {color:red}} @media (max-width: 767px) {.a {color:blue}}';
    const root = await process(css);
    assert.equal(root.nodes.length, 5);
    assert.equal(root.nodes[1].selector, '.a');
    assert.deepEqual(
        root.nodes.filter(({ type }) => type === 'atrule').map(({ params }) => params),
        ['(max-width: 767px)', '(max-width: 767px)', '(max-width: 1024px)', '(max-width: 767px)'],
    );
});
