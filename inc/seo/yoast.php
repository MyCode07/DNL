<?php

if (!defined('ABSPATH')) {
    exit;
}

add_filter('wpseo_title', 'frame_yoast_404_title');
function frame_yoast_404_title($title)
{
    if (is_404() && function_exists('pll_current_language') && pll_current_language('slug') === 'en') {
        return 'Page Not Found';
    }

    return $title;
}

add_filter('wpseo_schema_needs_breadcrumb', static function ($needed) {
    return !is_front_page() && $needed;
});

add_filter('wpseo_schema_webpage', static function ($data) {
    if (is_front_page()) {
        unset($data['breadcrumb']);
    }

    return $data;
});

// Empty values preserve Yoast's data; name, logo and sameAs stay in its UI.
add_filter('wpseo_schema_organization', 'frame_yoast_organization_data');
function frame_yoast_organization_data($data)
{
    $organization = get_localized_field('organization');

    if (!$organization) return $data;


    $details = [
        'description' => $organization['description'] ?? '',
        'email' => $organization['email'] ?? '',
        'telephone' => $organization['telephone'] ?? '',
        'legalName' => $organization['legalname'] ?? '',
        'foundingDate' => $organization['foundingdate'] ?? '',
        'numberOfEmployees' => $organization['numberofemployees'] ?? 1,
    ];

    foreach ($details as $property => $value) {
        if ($value === '' || $value === null) {
            continue;
        }

        if ($property === 'numberOfEmployees') {
            $data[$property] = [
                '@type' => 'QuantitativeValue',
                'value' => (int) $value,
            ];
        } else {
            $data[$property] = $value;
        }
    }

    return $data;
}

// Match the author information displayed in single-post/author.php.
add_filter('wpseo_schema_person_data', 'frame_yoast_author_data', 10, 2);
function frame_yoast_author_data($data, $user_id)
{
    unset($data['image'], $data['url']);

    foreach (frame_get_author_data($user_id) as $property => $value) {
        if ($value !== '') {
            $data[$property] = $value;
        }
    }

    return $data;
}

// A text ACF field can describe a reviewer without a WordPress account.
add_filter('wpseo_schema_webpage', 'frame_yoast_reviewer');
function frame_yoast_reviewer($data)
{
    if (!is_singular('post') || !function_exists('get_field')) {
        return $data;
    }

    $name = trim(wp_strip_all_tags((string) get_field('ekspert', get_queried_object_id())));
    if ($name !== '') {
        $data['reviewedBy'] = [
            '@type' => 'Person',
            'name' => $name,
        ];
    }

    return $data;
}

// Publications have no comment form; reject comments and pingbacks as well.
add_filter('comments_open', 'frame_post_comments_closed', 20, 2);
add_filter('pings_open', 'frame_post_comments_closed', 20, 2);
function frame_post_comments_closed($open, $post_id)
{
    return get_post_type($post_id) === 'post' ? false : $open;
}

add_filter('wpseo_schema_article', 'frame_yoast_article_without_comments');
function frame_yoast_article_without_comments($data)
{
    if (!is_singular('post')) {
        return $data;
    }

    unset($data['commentCount'], $data['comment']);
    if (isset($data['potentialAction'])) {
        $actions = array_values(array_filter($data['potentialAction'], static function ($action) {
            return !in_array('CommentAction', (array) ($action['@type'] ?? []), true);
        }));
        if ($actions) {
            $data['potentialAction'] = $actions;
        } else {
            unset($data['potentialAction']);
        }
    }

    return $data;
}
