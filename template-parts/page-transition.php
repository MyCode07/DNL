<?php // Early paint bridges normal document navigations; all animation lives in page-transition.js.
?>
<?php if (preg_match('/\biPhone\b/i', $_SERVER['HTTP_USER_AGENT'] ?? '')) : ?>
    <meta name="theme-color" content="#000">
    <style>
        canvas[data-page-transition] {
            --frame-transition-height: 120dvh;
        }
    </style>
<?php endif; ?>
<script>
    (() => {
        const state = window.framePageTransition = {
            enabled: true,
            keepCoverVisible: document.documentElement.dataset?.keepTransitionCover === 'true',
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
            cover.style.cssText = 'position:fixed;inset:0 0 auto;width:100%;height:100vh;height:max(100lvh,100dvh);height:var(--frame-transition-height,max(100lvh,100dvh));min-height:100%;z-index:2147483647;pointer-events:none;display:block';
            cover.style.minHeight = `${Math.ceil(Math.max(
                window.innerHeight || 0,
                (window.visualViewport?.height || 0) + (window.visualViewport?.offsetTop || 0)
            ))}px`;
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
