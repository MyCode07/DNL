import { createScope } from '../core/lifecycle.js';
import { createMenuAnimation } from '../animations/menu.js';
import { createProjectAnimation } from '../animations/menu-project.js';
import { trapFocus } from '../utils/focus.js';

export function initMenu(root, { media, scrollLock }) {
    const menu = root.querySelector('.menu');
    const toggle = menu?.querySelector('.menu-toggle');
    const header = menu?.closest('.header');
    const body = menu?.querySelector('.menu-body');
    const surface = menu?.querySelector('.menu-surface');
    if (!menu || !toggle || !header || !body || !surface) return;
    const label = toggle.querySelector('span');
    const scope = createScope();
    const animation = createMenuAnimation(menu, { media, toggle });
    const project = createProjectAnimation(header, media);
    let releaseScroll;

    function syncScrollLock(open) {
        if (open && media.mobile.matches) releaseScroll ??= scrollLock.acquire();
        else {
            releaseScroll?.();
            releaseScroll = undefined;
        }
    }

    function setOpen(open) {
        menu.classList.toggle('_open', open);
        toggle.setAttribute('aria-expanded', String(open));
        if (label && !media.compact.matches)
            label.textContent = open ? label.dataset.textClose : label.dataset.textOpen;
        syncScrollLock(open);
        project.sync();
        animation.animate(open);
    }

    function reset() {
        menu.classList.remove('_open');
        toggle.setAttribute('aria-expanded', 'false');
        if (label) label.textContent = label.dataset.textOpen;
        syncScrollLock(false);
        animation.reset();
        project.sync(true);
    }

    reset();
    scope.on(toggle, 'click', () => setOpen(!menu.classList.contains('_open')));
    scope.on(surface, 'click', (event) => {
        if (toggle.contains(event.target) || menu.classList.contains('_open')) return;
        setOpen(true);
    });
    scope.on(menu, 'click', (event) => {
        if (!(event.target instanceof Element)) return;
        if (event.target.closest('a') && menu.classList.contains('_open')) setOpen(false);
    });
    scope.on(root, 'keydown', (event) => {
        if (!menu.classList.contains('_open') || root.querySelector('.popup._open')) return;
        if (event.key === 'Escape') {
            setOpen(false);
            toggle.focus();
        } else if (media.mobile.matches) trapFocus(event, menu);
    });
    scope.on(media.mobile, 'change', reset);
    scope.on(media.compact, 'change', reset);
    scope.on(media.reducedMotion, 'change', reset);
    scope.add(() => {
        releaseScroll?.();
        menu.classList.remove('_open');
        toggle.setAttribute('aria-expanded', 'false');
        if (label) label.textContent = label.dataset.textOpen;
        animation.destroy();
        project.destroy();
    });
    return { syncProject: project.sync, destroy: scope.destroy };
}
