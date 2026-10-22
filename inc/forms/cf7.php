<?php

add_filter('wpcf7_autop_or_not', '__return_false');
add_filter('wpcf7_form_elements', function ($content) {
    $content = preg_replace('/<(span).*?class="\s*(?:.*\s)?wpcf7-form-control-wrap(?:\s[^"]+)?\s*"[^\>]*>(.*)<\/\1>/i', '\2', $content);
    return $content;
});


// add_filter('pll_get_post_types', function ($post_types, $is_settings) {
//     $post_types['wpcf7_contact_form'] = 'wpcf7_contact_form';
//     return $post_types;
// }, 10, 2);