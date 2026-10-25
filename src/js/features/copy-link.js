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
