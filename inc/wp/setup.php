<?php
if (!defined('ABSPATH')) {
    exit;
}
add_action('after_setup_theme', static function (): void {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['gallery', 'caption', 'style', 'script']);
    add_theme_support(
        'custom-logo',
        array(
            'height'      => 256,
            'width'       => 256,
            'flex-width'  => true,
            'flex-height' => true,
        )
    );
    register_nav_menus(['primary' => __('Primary menu', 'dnl-capital')]);
});
