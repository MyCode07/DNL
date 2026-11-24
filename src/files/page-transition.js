(() => {
    const loader = document.querySelector('.frame-page-transition');
    if (!loader || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const html = document.documentElement;
    const isIPhone = /\biPhone\b/.test(navigator.userAgent);
    if (isIPhone) {
        loader.dataset.pageTransitionOverscan = '';
    }
    const state = (window.framePageTransition = {
        enabled: true,
        pending: true,
        cover: null,
        ready: Promise.all([
            new Promise((resolve) => setTimeout(resolve, 450)),
            new Promise((resolve) => {
                if (document.readyState === 'complete') resolve();
                else window.addEventListener('load', resolve, { once: true });
            }),
        ]),
        mount(canvas, solid) {
            if (canvas) loader.append(canvas);
            if (!loader.isConnected) document.body.prepend(loader);
            state.setSolid(solid);
            loader.hidden = false;
            html.classList.add('frame-page-transition-active');
            state.syncPosition();
        },
        syncPosition() {
            if (isIPhone && loader.isConnected) {
                loader.style.top = `${window.visualViewport?.pageTop ?? window.scrollY}px`;
            }
        },
        setSolid(solid) {
            loader.classList.toggle('is-pixelated', !solid);
        },
        unmount() {
            loader.remove();
            html.classList.remove('frame-page-transition-active');
        },
        release() {
            state.pending = false;
            document.dispatchEvent(new Event('frame:page-reveal'));
        },
    });
    state.mount(null, true);
    state.fallback = setTimeout(() => {
        state.unmount();
        state.release();
    }, 4000);
})();
