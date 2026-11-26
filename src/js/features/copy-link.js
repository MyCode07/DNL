import { createScope } from '../core/lifecycle.js';

export function initCopyLinks(root = document) {
    const scope = createScope();
    const view = root.defaultView ?? root.ownerDocument?.defaultView ?? window;
    const notification = root.querySelector('.copied-text');
    let timer;
    let disposed = false;

    for (const button of root.querySelectorAll('.copy-url')) {
        scope.on(button, 'click', async (event) => {
            event.preventDefault();
            const url = button.getAttribute('data-url')?.trim();
            if (!url) return;

            try {
                await view.navigator.clipboard.writeText(url);
            } catch {
                if (!disposed) {
                    view.prompt('Не удалось скопировать автоматически. Скопируйте ссылку:', url);
                }
                return;
            }

            if (disposed || !notification) return;
            view.clearTimeout(timer);
            notification.classList.add('_active');
            timer = view.setTimeout(() => notification.classList.remove('_active'), 2000);
        });
    }

    scope.add(() => {
        disposed = true;
        view.clearTimeout(timer);
        notification?.classList.remove('_active');
    });
    return scope.destroy;
}

export function initCopyLinksInstagramTiktok(root = document) {
    const scope = createScope();
    const view = root.defaultView ?? root.ownerDocument?.defaultView ?? window;
    let timer;
    let disposed = false;

    for (const button of root.querySelectorAll('.js-share-copy-open')) {
        scope.on(button, 'click', async (event) => {
            event.preventDefault();
            const url = button.getAttribute('data-url')?.trim();
            const appUrl = button.getAttribute('data-app');
            const webUrl = button.getAttribute('data-web');
            const startTime = Date.now();

            if (!url) return;

            try {
                await view.navigator.clipboard.writeText(url);
            } catch {
                if (!disposed) {
                    view.prompt('Не удалось скопировать автоматически.', url);
                }
                return;
            }
            if (disposed) return;

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                view.navigator.userAgent,
            );

            if (isMobile) {
                view.clearTimeout(timer);
                timer = view.setTimeout(() => {
                    if (Date.now() - startTime < 2000 && !view.document.hidden) {
                        view.open(appUrl, '_blank', 'noopener,noreferrer');
                    }
                }, 1500);
            } else {
                view.open(webUrl, '_blank', 'noopener,noreferrer');
            }
        });
    }

    scope.add(() => {
        disposed = true;
        view.clearTimeout(timer);
    });
    return scope.destroy;
}
