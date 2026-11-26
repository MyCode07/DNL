<?php

// Replace WordPress Site Icon tags on the public site.
remove_action('wp_head', 'wp_site_icon', 99);

add_action('wp_head', static function (): void {
    $directory = 'dist/files/favicon/';
    ?>
    <link rel="icon" type="image/png" sizes="96x96" href="<?php echo esc_url(get_theme_file_uri($directory . 'favicon-96x96.png')); ?>">
    <link rel="icon" type="image/svg+xml" href="<?php echo esc_url(get_theme_file_uri($directory . 'favicon.svg')); ?>">
    <link rel="shortcut icon" href="<?php echo esc_url(get_theme_file_uri($directory . 'favicon.ico')); ?>">
    <link rel="apple-touch-icon" sizes="180x180" href="<?php echo esc_url(get_theme_file_uri($directory . 'apple-touch-icon.png')); ?>">
    <link rel="manifest" href="<?php echo esc_url(get_theme_file_uri($directory . 'site.webmanifest')); ?>">
    <?php
}, 99);
