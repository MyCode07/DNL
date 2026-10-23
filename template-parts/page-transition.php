<?php // Early paint bridges normal document navigations; all animation lives in page-transition.js. ?>
<script>
(() => {
    const state = window.framePageTransition = { enabled: true, pending: false, cover: null };
    state.release = () => {
        state.pending = false;
        document.dispatchEvent(new Event('frame:page-reveal'));
    };
    const key = 'frame:page-transition';
    try {
        const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
        sessionStorage.removeItem(key);
        if (!state.enabled || !saved || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const target = new URL(saved.url);
        if (!Number.isFinite(saved.at) || Date.now() - saved.at < 0 || Date.now() - saved.at > 15000 || target.origin !== location.origin ||
            target.pathname.replace(/\/$/, '') !== location.pathname.replace(/\/$/, '') ||
            target.search !== location.search) return;
        const cover = document.createElement('canvas');
        const context = cover.getContext('2d');
        if (!context) return;
        cover.width = cover.height = 1;
        cover.dataset.pageTransition = '';
        cover.setAttribute('aria-hidden', 'true');
        cover.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;display:block';
        context.fillStyle = '#fff';
        context.fillRect(0, 0, 1, 1);
        document.documentElement.append(cover);
        state.cover = cover;
        state.pending = true;
        // A missing or failed app bundle must never leave the page covered.
        state.fallback = setTimeout(() => { cover.remove(); state.cover = null; state.release(); }, 4000);
    } catch { /* Storage may be unavailable; retain ordinary browser navigation. */ }
})();
</script>
