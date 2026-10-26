import { createScope } from './core/lifecycle.js';
import { createMediaQueries } from './core/media.js';
import { createScrollLock } from './core/scroll-lock.js';
import { ScrollTrigger } from './core/gsap.js';
import { initAnimations } from './animations/index.js';
import { initPageTransition } from './animations/page-transition.js';
import { initSmoothScroll } from './features/smooth-scroll.js';
import { initMenu } from './features/menu.js';
import { initHeader } from './features/header.js';
import { initPopups } from './features/popups.js';
import { initSliders } from './features/sliders.js';
import { initProjectDescriptions } from './features/project-descriptions.js';
import { initTabs } from './features/tabs.js';
import { initPageList } from './features/page-list.js';
import { initPostTitleHeight } from './features/postTitleHeight.js';
import { initAuthor } from './features/author.js';
import { initCopyLinks } from './features/copy-link.js';
import { initPopupResults } from './features/popup-results.js';
import { initContactForms } from './features/contact-forms.js';
import { initLoadMorePosts } from './features/load-more-posts.js';

let destroyCurrentApp;

/** Start one app instance. Reinitialization first releases all previous resources.
 * @param {Document} root
 */
export function initApp(root = document) {
    destroyCurrentApp?.();
    const scope = createScope();
    try {
        const media = createMediaQueries();
        const smoothScroll = initSmoothScroll(media);
        scope.add(smoothScroll.destroy);
        const scrollLock = createScrollLock(root, smoothScroll);
        scope.add(scrollLock.destroy);
        const menu = initMenu(root, { media, scrollLock });
        scope.add(menu?.destroy);
        scope.add(initHeader(root, menu));
        scope.add(initPopups(root, scrollLock, media));
        scope.add(initPopupResults(root, media));
        scope.add(initContactForms(root));
        scope.add(initSliders(root, media));
        scope.add(initPostTitleHeight(root));
        scope.add(initLoadMorePosts(root, { onLoaded: () => ScrollTrigger.refresh() }));
        scope.add(initAuthor(root, media));
        scope.add(initCopyLinks(root));
        scope.add(initTabs(root));
        scope.add(initProjectDescriptions(root));
        scope.add(initPageList(root));
        scope.add(initAnimations(root));
        scope.add(initPageTransition(root));
        ScrollTrigger.refresh();
    } catch (error) {
        try {
            scope.destroy();
        } catch (cleanupError) {
            throw new AggregateError(
                [error, cleanupError],
                'App initialization and cleanup failed',
                { cause: cleanupError },
            );
        }
        throw error;
    }
    destroyCurrentApp = scope.destroy;
    return destroyCurrentApp;
}

const bootstrap = new AbortController();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initApp(), {
        once: true,
        signal: bootstrap.signal,
    });
} else {
    initApp();
}

if (import.meta.hot) {
    // Let JS updates reach Vite's full-page reload instead of accepting partial updates.
    import.meta.hot.dispose(() => {
        bootstrap.abort();
        destroyCurrentApp?.();
    });
}
