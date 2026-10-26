import { createScope } from '../core/lifecycle.js';

export function initLoadMore(root, { onLoaded = () => {} } = {}) {
    const scope = createScope();
    const view = root.defaultView;
    for (const button of root.querySelectorAll('.load-more[data-load-more]')) {
        const container = button.parentElement.querySelector('[data-posts-container]');
        if (!container) continue;
        const config = JSON.parse(button.dataset.loadMore);
        const originalText = button.textContent;
        const status = root.createElement('p');
        status.setAttribute('role', 'status');
        status.hidden = true;
        button.after(status);
        let loading = false;
        let disposed = false;
        let controller;
        scope.on(container, 'load', () => onLoaded(container), { capture: true });

        scope.on(button, 'click', async () => {
            if (loading || disposed) return;
            loading = true;
            controller = new AbortController();
            button.disabled = true;
            button.textContent = button.dataset.textLoading || originalText;
            container.setAttribute('aria-busy', 'true');
            status.hidden = true;
            try {
                const body = new URLSearchParams({
                    action: 'frame_load_more',
                    query: config.query,
                    signature: config.signature,
                    page: String(config.page + 1),
                    lang: config.lang,
                });
                const response = await view.fetch(config.url, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body,
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();
                if (disposed) return;
                const data = result.data;
                if (
                    !result.success ||
                    typeof data?.html !== 'string' ||
                    typeof data.has_more !== 'boolean' ||
                    data.page !== config.page + 1
                ) {
                    throw new Error('Invalid pagination response');
                }
                const template = root.createElement('template');
                template.innerHTML = data.html;
                // Existing entrance observers only own the initial cards.
                template.content.querySelectorAll('.post-item').forEach((card) => {
                    card.classList.add('is-revealed');
                });
                container.append(template.content);
                config.page = data.page;
                if (!data.has_more) button.remove();
                onLoaded(container);
            } catch (error) {
                if (disposed || error.name === 'AbortError') return;
                status.textContent = button.dataset.textError;
                status.hidden = false;
            } finally {
                loading = false;
                if (!disposed) {
                    button.disabled = false;
                    button.textContent = originalText;
                    container.removeAttribute('aria-busy');
                }
            }
        });
        scope.add(() => {
            disposed = true;
            controller?.abort();
            button.disabled = false;
            button.textContent = originalText;
            container.removeAttribute('aria-busy');
            status.remove();
        });
    }
    return scope.destroy;
}
