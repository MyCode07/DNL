import { createScope } from '../core/lifecycle.js';

/** TEMPORARY: remove this feature and its app registration after backend integration. */
export function initPopupDemo(root) {
    const scope = createScope();
    let timer;
    let chooser;

    function clear() {
        clearTimeout(timer);
        chooser?.remove();
        chooser = undefined;
    }

    function schedule(event) {
        clear();
        const popup = event.target;
        if (!popup.querySelector('[data-popup-result]')) return;
        timer = setTimeout(() => {
            if (!popup.classList.contains('_open')) return;
            chooser = root.createElement('div');
            chooser.className = 'popup-demo';
            chooser.setAttribute('role', 'group');
            chooser.setAttribute('aria-label', 'Имитация результата отправки');
            chooser.innerHTML = `
                <button type="button" class="arrow-btn text-m" data-demo-result="success">Успех</button>
                <button type="button" class="arrow-btn text-m" data-demo-result="error">Ошибка</button>`;
            popup.append(chooser);
            chooser.querySelector('button').focus({ preventScroll: true });
        }, 1000);
    }

    scope.on(root, 'popup:open', schedule);
    scope.on(root, 'popup:retry', schedule);
    scope.on(root, 'popup:close', clear);
    scope.on(root, 'click', (event) => {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest('[data-demo-result]');
        if (!button || !chooser?.contains(button)) return;
        const popup = button.closest('.popup');
        const outcome = button.dataset.demoResult;
        clear();
        popup.dispatchEvent(new CustomEvent('popup:result', { detail: outcome }));
    });
    // This is a local preview: never navigate or submit form data to a server.
    scope.on(root, 'submit', (event) => {
        if (event.target.closest('.popup')) event.preventDefault();
    });
    scope.add(clear);
    return scope.destroy;
}
