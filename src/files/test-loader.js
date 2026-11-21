(() => {
    const loader = document.querySelector('.frame-test-loader');
    if (!loader || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const html = document.documentElement;
    const started = performance.now();
    const state = (window.framePageTransition = { enabled: false, pending: true });
    loader.hidden = false;
    html.classList.add('frame-test-loader-active');

    function finish() {
        loader.remove();
        html.classList.remove('frame-test-loader-active');
        state.pending = false;
        document.dispatchEvent(new Event('frame:page-reveal'));
    }

    function reveal() {
        clearTimeout(watchdog);
        loader.classList.add('is-leaving');
        setTimeout(finish, 300);
    }

    const watchdog = setTimeout(reveal, 4000);
    const onLoad = () => {
        if (!loader.isConnected || loader.classList.contains('is-leaving')) return;
        clearTimeout(watchdog);
        setTimeout(reveal, Math.max(0, 450 - (performance.now() - started)));
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
})();
