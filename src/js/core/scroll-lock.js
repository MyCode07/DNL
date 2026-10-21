/** A lock stays active until every overlay has released its own handle. */
export function createScrollLock(root, smoothScroll) {
    const locks = new Set();
    const savedPadding = new Map();
    const body = root.body;
    let originallyLocked = false;

    function lock() {
        originallyLocked = body.classList.contains('_noscroll');
        const scrollbar = Math.max(0, window.innerWidth - root.documentElement.clientWidth);
        if (scrollbar) {
            const elements = new Set([body, ...root.querySelectorAll('._fixed')]);
            for (const element of elements) {
                savedPadding.set(element, [
                    element.style.getPropertyValue('padding-right'),
                    element.style.getPropertyPriority('padding-right'),
                ]);
                const padding = Number.parseFloat(getComputedStyle(element).paddingRight) || 0;
                element.style.paddingRight = `${padding + scrollbar}px`;
            }
        }
        body.classList.add('_noscroll');
        smoothScroll.stop();
    }

    function unlock() {
        for (const [element, [value, priority]] of savedPadding) {
            if (value) element.style.setProperty('padding-right', value, priority);
            else element.style.removeProperty('padding-right');
        }
        savedPadding.clear();
        body.classList.toggle('_noscroll', originallyLocked);
        smoothScroll.start();
    }

    return {
        acquire() {
            const token = Symbol('scroll-lock');
            if (!locks.size) lock();
            locks.add(token);
            return () => {
                if (!locks.delete(token)) return;
                if (!locks.size) unlock();
            };
        },
        destroy() {
            if (!locks.size) return;
            locks.clear();
            unlock();
        },
    };
}
