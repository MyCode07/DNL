<?php

/** Set WP_VITE_DEV to true in local wp-config.php only while npm run dev is running. */
add_action('wp_enqueue_scripts', static function (): void {
    if (frame_is_vite_dev()) {
        // Vite dev requires native ES modules (and its HMR client).
        wp_enqueue_script('theme-vite-client', frame_asset('@vite/client'), [], null, false);
        wp_enqueue_style('theme-style', frame_asset('scss/style.scss'), [], null);
        wp_enqueue_script('theme-app', frame_asset('js/app.js'), [], null, true);
        return;
    }
    $css = 'dist/css/style.min.css';
    $js  = 'dist/js/app.min.js';
    if (file_exists(get_theme_file_path($css))) {
        wp_enqueue_style('theme-style', get_theme_file_uri($css), [], (string) filemtime(get_theme_file_path($css)));
    }
    if (file_exists(get_theme_file_path($js))) {
        wp_enqueue_script('theme-app', get_theme_file_uri($js), [], (string) filemtime(get_theme_file_path($js)), true);
    }
});
add_filter('script_loader_tag', static function (string $tag, string $handle): string {
    if (in_array($handle, ['theme-vite-client', 'theme-app'], true)) {
        return preg_replace('/<script\b/', '<script type="module"', $tag, 1) ?? $tag;
    }
    return $tag;
}, 10, 2);

// Hide the page scrollbar for local design overlays without disabling scrolling.
add_action('wp_footer', static function (): void {
    if (!frame_is_vite_dev()) {
        return;
    }

    wp_print_inline_script_tag(<<<'JS'
(() => {
    const style = document.createElement('style');
    style.textContent = `
        html, body {
            scrollbar-width: none !important;
            scrollbar-gutter: auto !important;
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }
    `;
    document.head.append(style);
})();
JS, ['id' => 'frame-dev-scrollbar']);
});

// Enable viewport diagnostics with ?viewport-debug=1.
add_action('wp_footer', static function (): void {
    wp_print_inline_script_tag(<<<'JS'
(() => {
    if (new URLSearchParams(location.search).get('viewport-debug') !== '1') return;

    const panel = document.createElement('pre');
    panel.style.cssText = 'position:fixed;top:env(safe-area-inset-top,0px);left:50%;transform:translateX(-50%);z-index:2147483647;margin:0;padding:8px;max-width:95vw;box-sizing:border-box;background:#111;color:#fff;font:12px/1.4 monospace;white-space:pre-wrap;pointer-events:none';
    document.body.append(panel);

    const probes = {};
    for (const unit of ['svh', 'lvh', 'dvh']) {
        if (!CSS.supports('height', `100${unit}`)) continue;
        const probe = document.createElement('span');
        probe.style.cssText = `position:fixed;top:0;left:0;width:0;height:100${unit};visibility:hidden;pointer-events:none`;
        panel.append(probe);
        probes[unit] = probe;
    }

    const output = document.createTextNode('');
    panel.append(output);
    const hero = document.querySelector('.hero__br_image') || document.querySelector('.hero__bg-image');
    const px = (value) => value == null ? '—' : `${value.toFixed(1)} px`;

    function update() {
        output.data = [
            `window.innerHeight: ${px(window.innerHeight)}`,
            `Видимая область: ${px(window.visualViewport?.height)}`,
            `Панели раскрыты (100svh): ${px(probes.svh?.getBoundingClientRect().height)}`,
            `Панели скрыты (100lvh): ${px(probes.lvh?.getBoundingClientRect().height)}`,
            `Текущая высота (100dvh): ${px(probes.dvh?.getBoundingClientRect().height)}`,
            hero
                ? `.${hero.classList.contains('hero__br_image') ? 'hero__br_image' : 'hero__bg-image'}: ${px(hero.getBoundingClientRect().height)}`
                : '.hero__br_image / .hero__bg-image: элемент не найден',
        ].join('\n');
    }

    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    const observer = new ResizeObserver(update);
    Object.values(probes).forEach((probe) => observer.observe(probe));
    if (hero) observer.observe(hero);
    update();
})();
JS, ['id' => 'frame-viewport-debug']);
});
