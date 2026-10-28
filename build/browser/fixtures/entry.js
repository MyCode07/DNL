import { createScope } from '../../../src/js/core/lifecycle.js';
import { createMediaQueries } from '../../../src/js/core/media.js';
import { createScrollLock } from '../../../src/js/core/scroll-lock.js';
import { initMenu } from '../../../src/js/features/menu.js';
import { initPopups } from '../../../src/js/features/popups.js';
import { initPopupResults } from '../../../src/js/features/popup-results.js';
import { initContactForms } from '../../../src/js/features/contact-forms.js';
import { initProjectDescriptions } from '../../../src/js/features/project-descriptions.js';
import { initTabs } from '../../../src/js/features/tabs.js';

window.mountComponents = () => {
    window.destroyComponents?.();
    const scope = createScope();
    const media = createMediaQueries();
    const scrollLock = createScrollLock(document, { stop() {}, start() {} });
    scope.add(scrollLock.destroy);
    scope.add(initMenu(document, { media, scrollLock })?.destroy);
    scope.add(initPopups(document, scrollLock, media));
    scope.add(initPopupResults(document, media));
    scope.add(initContactForms(document));
    scope.add(initProjectDescriptions(document));
    scope.add(initTabs(document));
    window.destroyComponents = scope.destroy;
};
window.mountComponents();
