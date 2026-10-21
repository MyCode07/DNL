import { createScope } from '../core/lifecycle.js';

export function initAuthor(root, media) {
    const scope = createScope();
    const authors = [...root.querySelectorAll('.data-author')];

    for (const author of authors) {
        scope.on(author, 'click', (event) => {
            if (!media.mobile.matches || !(event.target instanceof Element)) return;
            author.classList.toggle('_active', !event.target.closest('.arrow-btn'));
        });
    }

    scope.on(root, 'click', (event) => {
        if (!media.mobile.matches || !(event.target instanceof Element)) return;
        authors.forEach((author) => {
            if (!author.contains(event.target)) author.classList.remove('_active');
        });
    });

    function reset() {
        authors.forEach((author) => author.classList.remove('_active'));
    }

    scope.on(media.mobile, 'change', reset);
    scope.add(reset);
    return scope.destroy;
}
