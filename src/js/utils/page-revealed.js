/** Stateful handoff: late subscribers resolve immediately; cleanup removes listeners. */
export function whenPageRevealed(root, signal) {
    if (signal?.aborted || !root.defaultView?.framePageTransition?.pending)
        return Promise.resolve();
    return new Promise((resolve) => {
        const finish = () => {
            root.removeEventListener('frame:page-reveal', check);
            signal?.removeEventListener('abort', finish);
            resolve();
        };
        const check = () => {
            if (!root.defaultView?.framePageTransition?.pending) finish();
        };
        root.addEventListener('frame:page-reveal', check);
        signal?.addEventListener('abort', finish, { once: true });
        check();
    });
}
