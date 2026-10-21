/** Own event listeners and disposers for one component instance. */
export function createScope() {
    const controller = new AbortController();
    const cleanups = [];
    let disposed = false;

    return {
        on(target, type, listener, options = {}) {
            target.addEventListener(type, listener, { ...options, signal: controller.signal });
        },
        add(cleanup) {
            if (typeof cleanup !== 'function') return;
            if (disposed) cleanup();
            else cleanups.push(cleanup);
        },
        destroy() {
            if (disposed) return;
            disposed = true;
            controller.abort();
            const errors = [];
            for (const cleanup of cleanups.reverse()) {
                try {
                    cleanup();
                } catch (error) {
                    errors.push(error);
                }
            }
            cleanups.length = 0;
            if (errors.length) throw new AggregateError(errors, 'Component cleanup failed');
        },
    };
}
