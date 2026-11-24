(() => {
    const loader = document.querySelector('.frame-page-transition');
    if (!loader || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const html = document.documentElement;
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
        },
        setSolid(solid) {
            loader.classList.toggle('is-pixelated', !solid);
            html.classList.toggle('frame-page-transition-solid', solid);
        },
        unmount() {
            loader.remove();
            html.classList.remove('frame-page-transition-active', 'frame-page-transition-solid');
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
