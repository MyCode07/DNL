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
