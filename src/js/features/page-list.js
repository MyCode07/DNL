import { createScope } from '../core/lifecycle.js';

// Preserve the development page switcher without placing its handler in app.js.
export function initPageList(root) {
    const scope = createScope();
    scope.on(root, 'click', (event) => {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest('.pages-close');
        button?.closest('.pages')?.classList.toggle('_hide');
    });
    return scope.destroy;
}
