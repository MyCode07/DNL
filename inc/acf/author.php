<?php

/** Shared author values for publication templates and structured data. */
function frame_get_author_data($user_id)
{
    $english = function_exists('pll_current_language') && pll_current_language('slug') === 'en';
    $values = [];

    foreach (['name' => 'imya', 'jobTitle' => 'dolzhnost', 'description' => 'opisanie'] as $key => $field) {
        $value = '';
        if (function_exists('get_field')) {
            if ($english) {
                $value = trim(wp_strip_all_tags((string) get_field($field . '_en', 'user_' . $user_id)));
            }
            if ($value === '') {
                $value = trim(wp_strip_all_tags((string) get_field($field, 'user_' . $user_id)));
            }
        }
        $values[$key] = $value;
    }

    if ($values['name'] === '') {
        $values['name'] = trim(wp_strip_all_tags((string) get_the_author_meta('display_name', $user_id)));
    }

    return $values;
}
