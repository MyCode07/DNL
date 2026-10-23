<?php

add_filter('wpcf7_autop_or_not', '__return_false');
// Keep field wrappers: CF7 needs them for validation and accessible errors.

function frame_cf7_is_user_text($tag) {
    return in_array($tag->basetype, ['text', 'textarea', 'email', 'tel', 'url'], true)
        && !str_contains($tag->name, 'honeypot') && $tag->name !== 'wpcf7_hp_field';
}

add_filter('wpcf7_posted_data', function ($data) {
    $form = WPCF7_ContactForm::get_current();
    if (!$form) return $data;
    foreach ($form->scan_form_tags() as $tag) {
        if (frame_cf7_is_user_text($tag) && isset($data[$tag->name]) && is_string($data[$tag->name])) {
            $data[$tag->name] = preg_replace('/^\s+|\s+$/u', '', $data[$tag->name]);
        }
    }
    return $data;
});

add_filter('wpcf7_validate', function ($result, $tags) {
    $submission = WPCF7_Submission::get_instance();
    if (!$submission) return $result;
    foreach ($tags as $tag) {
        if (!frame_cf7_is_user_text($tag)) continue;
        $value = $submission->get_posted_data($tag->name);
        if (!is_string($value) && $value !== null) {
            $result->invalidate($tag, wpcf7_get_message('invalid_required'));
            continue;
        }
        $value = (string) $value;
        if ($tag->is_required() && $value === '') {
            $result->invalidate($tag, wpcf7_get_message('invalid_required'));
        } elseif ($tag->basetype !== 'email' && $value !== '' && mb_strlen($value) < 2) {
            $result->invalidate($tag, wpcf7_get_message('invalid_too_short'));
        }
    }
    return $result;
}, 20, 2);

// Preserve checkbox rules; replace only budget's required rule with an OR.
add_action('wpcf7_init', function () {
    remove_action('wpcf7_swv_create_schema', 'wpcf7_swv_add_checkbox_rules', 10);
    add_action('wpcf7_swv_create_schema', 'frame_cf7_checkbox_rules', 10, 2);
});

function frame_cf7_checkbox_rules($schema, $form) {
    $tags = $form->scan_form_tags();
    $budget = null;
    $custom = null;
    foreach ($tags as $tag) {
        if ($tag->name === 'budget' && $tag->type === 'radio') $budget = $tag;
        if ($tag->name === 'budget_custom' && $tag->basetype === 'text') $custom = $tag;
    }
    if (!$budget || !$custom) {
        wpcf7_swv_add_checkbox_rules($schema, $form);
        return;
    }
    foreach ($tags as $tag) {
        if (!in_array($tag->basetype, ['checkbox', 'radio'], true)) continue;
        if ($tag->name === 'budget') {
            $either = wpcf7_swv_create_rule('any', [
                'field' => 'budget', 'error' => wpcf7_get_message('invalid_required'),
            ]);
            foreach (['budget', 'budget_custom'] as $name) {
                $either->addRule(wpcf7_swv_create_rule('required', [
                    'field' => $name, 'error' => wpcf7_get_message('invalid_required'),
                ]));
            }
            $schema->add_rule($either);
        } elseif ($tag->is_required() || $tag->type === 'radio') {
            $schema->add_rule(wpcf7_swv_create_rule('required', [
                'field' => $tag->name, 'error' => wpcf7_get_message('invalid_required'),
            ]));
        }
        if ($tag->type === 'radio' || $tag->has_option('exclusive')) {
            $schema->add_rule(wpcf7_swv_create_rule('maxitems', [
                'field' => $tag->name, 'threshold' => 1,
                'error' => $form->filter_message(__('Too many items are selected.', 'contact-form-7')),
            ]));
        }
    }
}
