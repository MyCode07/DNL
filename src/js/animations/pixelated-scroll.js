import { ScrollTrigger, gsap } from '../core/gsap.js';
import { createPixelCells } from '../utils/pixels.js';

const ROWS = 3;
const MAX_PIXEL_SIZE = {
    desktop: 100,
    below1280: 80,
    below1024: 60,
    below767: 40,
};

function initCanvases(root, maxPixelSize) {
    const cleanups = [];
    for (const element of root.querySelectorAll('[data-pixelated-scroll-transition]')) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;
        canvas.setAttribute('aria-hidden', 'true');
        element.append(canvas);
        const originalHeight = element.style.height;
        let cells = [];
        let width = 0;
        let ratio = 1;
        let progress = 0;
        let refreshFrame = 0;

        function draw(progress) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = element.dataset.color || '#ffffff';
            for (const cell of cells) {
                if (progress >= cell.threshold) {
                    context.fillRect(cell.x, cell.y, cell.width, cell.height);
                }
            }
        }

        function resize() {
            const nextWidth = element.getBoundingClientRect().width;
            const nextRatio = Math.min(window.devicePixelRatio || 1, 2);
            if (!nextWidth || (nextWidth === width && nextRatio === ratio)) return;
            width = nextWidth;
            ratio = nextRatio;
            const columns = Math.ceil(width / maxPixelSize);
            const pixelSize = width / columns;
            const height = pixelSize * ROWS;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            element.style.height = `${height}px`;
            cells = createPixelCells(
                columns,
                ROWS,
                element.dataset.direction === 'up' ? 'up' : 'down',
            ).map((cell) => {
                // Shared integer edges keep adjacent cells opaque without overlaps or seams.
                const x = Math.round((cell.column * canvas.width) / columns);
                const y = Math.round((cell.row * canvas.height) / ROWS);
                const right = Math.round(((cell.column + 1) * canvas.width) / columns);
                const bottom = Math.round(((cell.row + 1) * canvas.height) / ROWS);
                return { ...cell, x, y, width: right - x, height: bottom - y };
            });
            draw(progress);
            // Avoid synchronous refresh inside a ResizeObserver callback.
            cancelAnimationFrame(refreshFrame);
            refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
        }

        resize();
        const trigger = ScrollTrigger.create({
            trigger: element,
            start: element.dataset.scrollStart || 'top bottom',
            end: element.dataset.scrollEnd || 'bottom 0%',
            scrub: true,
            onUpdate: (self) => {
                progress = self.progress;
                draw(progress);
            },
            onRefresh: (self) => {
                progress = self.progress;
                draw(progress);
            },
        });
        const observer = new ResizeObserver(resize);
        observer.observe(element);
        cleanups.push(() => {
            observer.disconnect();
            cancelAnimationFrame(refreshFrame);
            trigger.kill();
            canvas.remove();
            element.style.height = originalHeight;
        });
    }
    return () => cleanups.reverse().forEach((cleanup) => cleanup());
}

/** Decorative pixel transitions are removed when reduced motion is requested. */
export function initPixelatedScroll(root) {
    const media = gsap.matchMedia();
    media.add(
        {
            motion: '(prefers-reduced-motion: no-preference)',
            below1280: '(width < 1280px)',
            below1024: '(width < 1024px)',
            below767: '(width < 767px)',
        },
        ({ conditions }) => {
            if (!conditions.motion) return;
            const maxPixelSize = conditions.below767
                ? MAX_PIXEL_SIZE.below767
                : conditions.below1024
                  ? MAX_PIXEL_SIZE.below1024
                  : conditions.below1280
                    ? MAX_PIXEL_SIZE.below1280
                    : MAX_PIXEL_SIZE.desktop;
            return initCanvases(root, maxPixelSize);
        },
    );
    return () => media.revert();
}
