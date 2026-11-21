<?php // Early paint bridges normal document navigations; all animation lives in page-transition.js.
?>
<meta name="theme-color" content="#000" media="(scripting: enabled) and (any-pointer: coarse) and (prefers-reduced-motion: no-preference)">
<meta name="theme-color" content="#fff">
<style>
    html.frame-transition-dark,
    html.frame-transition-dark body {
        background-color: #000;
    }
</style>
<script>
    (() => {
        const state = window.framePageTransition = {
            enabled: true,
            pending: false,
            cover: null
        };
        if (/\biPhone\b/.test(window.navigator?.userAgent ?? '')) {
            state.setDocumentTint = (active) => {
                document.documentElement.classList.toggle('frame-transition-dark', active);
            };
        }
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
            state.setDocumentTint?.(false);
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
            cover.style.cssText = 'position:fixed;inset:0 0 auto;width:100%;height:100vh;height:max(100lvh,100dvh);min-height:100%;z-index:2147483647;pointer-events:none;display:block';
            cover.style.minHeight = `${Math.ceil(Math.max(
                window.innerHeight || 0,
                (window.visualViewport?.height || 0) + (window.visualViewport?.offsetTop || 0)
            ))}px`;
            context.fillStyle = '#000';
            context.fillRect(0, 0, 1, 1);
            document.documentElement.append(cover);
            state.cover = cover;
            state.setDocumentTint?.(true);
            state.pending = true;
        } catch {
            state.cover?.remove();
            state.cover = null;
            state.setDocumentTint?.(false);
            state.release();
        }
    })();
</script>
