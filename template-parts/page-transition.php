<?php // Early paint bridges normal document navigations; all animation lives in page-transition.js.
?>
<script>
    (() => {
        const state = window.framePageTransition = {
            enabled: true,
            pending: false,
            cover: null
        };
        state.release = () => {
            state.pending = false;
            document.dispatchEvent(new Event('frame:page-reveal'));
        };
        // Safety recovery only: animation completion releases normal reveals.
        state.fallback = setTimeout(() => {
            if (!state.pending && window.frameElementRevealReady) return;
            state.failed = true;
            state.cover?.remove();
            state.cover = null;
            document.documentElement.classList.add('reveal-disabled');
            state.release();
        }, 4000);
        try {
            // First loads and reloads also open; consume the previous document's marker.
            sessionStorage.removeItem('frame:page-transition');
        } catch {
            /* Storage is optional for the entrance phase. */
        }
        if (!state.enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        try {
            const cover = document.createElement('canvas');
            const context = cover.getContext('2d');
            if (!context) return;
            cover.width = cover.height = 1;
            cover.dataset.pageTransition = '';
            cover.setAttribute('aria-hidden', 'true');
            cover.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;display:block';
            context.fillStyle = '#000';
            context.fillRect(0, 0, 1, 1);
            document.documentElement.append(cover);
            state.cover = cover;
            state.pending = true;
        } catch {
            state.cover?.remove();
            state.cover = null;
            state.release();
        }
    })();
</script>