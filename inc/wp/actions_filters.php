<?php

// editor styles
add_action('after_setup_theme', 'cssstyle_setup');
function cssstyle_setup()
{
    add_theme_support('editor-styles');
    add_editor_style('assets/style-editor.css');
}


// remove body svg
remove_action('wp_body_open', 'wp_global_styles_render_svg_filters');


// menu
add_filter('nav_menu_css_class', 'nav_css_filter');
function nav_css_filter($classes)
{
    return $classes = [];
}


// remove  archive title prefix
add_filter('get_the_archive_title_prefix', '__return_empty_string');


add_filter('wp_title', 'decode_html_chars', 10, 3);
function decode_html_chars($title, $sep, $seplocation)
{
    return wp_specialchars_decode($title, ENT_QUOTES);
}

add_filter('the_title', 'specialchars_decode');
function specialchars_decode($title)
{
    return wp_specialchars_decode($title, ENT_QUOTES);
}


add_filter('the_title', 'remove_nbsp');
function remove_nbsp($title)
{
    $title = str_replace('&nbsp;',  '', $title);
    $title = str_replace('/\s+/', ' ', $title);
    $title = preg_replace('~\x{00a0}~siu', ' ', $title);
    return $title;
}