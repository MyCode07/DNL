<?php
// Temporary viewport diagnostics. Remove this file and its functions.php include after testing.
if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_footer', static function (): void {
    if (!is_front_page()) {
        return;
    }
    ?>
    <pre id="hero-debug" style="position:fixed;top:0;left:0;z-index:2147483647;max-width:100vw;max-height:65vh;overflow:hidden;box-sizing:border-box;margin:0;padding:1rem;background:#fff;color:#111;font:400 1rem/1.4 monospace;text-align:left;white-space:pre-wrap;pointer-events:none;border:1px solid #aaa;border-radius:0 0 .6rem 0;box-shadow:0 .2rem 1rem #0003"></pre>
    <script>
        (() => {
            const panel = document.getElementById('hero-debug');
            const hero = document.querySelector('.hero');
            if (!hero) {
                panel.remove();
                return;
            }
            const targets = [
                ['HERO', hero],
                ['BACKGROUND', hero.querySelector('.hero__bg-image')],
                ['CONTENT', hero.querySelector('.hero__content')],
            ];
            const px = value => `${value.toFixed(1)}px`;
            let frame = 0;
            let updates = 0;

            function render() {
                frame = 0;
                const viewport = window.visualViewport;
                const lines = [
                    `HERO DEBUG | update ${++updates}`,
                    `scrollY       ${px(window.scrollY)}`,
                    `innerHeight   ${px(window.innerHeight)}`,
                    `clientHeight  ${px(document.documentElement.clientHeight)}`,
                    `visual height ${viewport ? px(viewport.height) : 'n/a'}`,
                    `visual top    ${viewport ? px(viewport.offsetTop) : 'n/a'}`,
                ];

                for (const [name, element] of targets) {
                    if (!element) continue;
                    const rect = element.getBoundingClientRect();
                    const css = getComputedStyle(element);
                    lines.push(
                        '', `${name} [${css.position}]`,
                        `rect top      ${px(rect.top)}`,
                        `document top  ${px(rect.top + window.scrollY)}`,
                        `rect height   ${px(rect.height)}`,
                        `CSS top       ${css.top}`,
                        `CSS height    ${css.height}`,
                        `min-height    ${css.minHeight}`,
                    );
                    if (name === 'BACKGROUND') {
                        lines.push(`bg position   ${css.backgroundPosition}`, `bg size       ${css.backgroundSize}`);
                    }
                }
                panel.textContent = lines.join('\n');
            }

            function schedule() {
                if (!frame) frame = requestAnimationFrame(render);
            }

            window.addEventListener('scroll', schedule, { passive: true });
            window.addEventListener('resize', schedule, { passive: true });
            window.visualViewport?.addEventListener('resize', schedule, { passive: true });
            window.visualViewport?.addEventListener('scroll', schedule, { passive: true });
            const observer = new ResizeObserver(schedule);
            targets.forEach(([, element]) => { if (element) observer.observe(element); });
            render();
        })();
    </script>
    <?php
}, 100);
