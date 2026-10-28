<?php

add_filter('wp_sitemaps_posts_entry', function ($entry, $post) {
    if ((float) ($entry['priority'] ?? 0) === 0.5) {
        $entry['priority'] = '0.7';
    }

    if ((int) get_option('page_on_front') === $post->ID) {
        $entry['priority'] = '1.0';
    }

    return $entry;
}, 999, 2);


add_filter('wp_sitemaps_taxonomies_entry', function ($entry, $term_id, $taxonomy, $term) {
    if (!in_array($taxonomy, ['category', 'product_cat'], true)) {
        return $entry;
    }

    if (!$term instanceof WP_Term) {
        return $entry;
    }

    $entry['priority'] = (int) $term->parent > 0 ? '0.8' : '0.9';

    // Change frequency
    $entry['changefreq'] = 'monthly';

    // Last modification date
    $posts = get_posts([
        'post_type'      => $taxonomy === 'product_cat' ? 'product' : 'post',
        'post_status'    => 'publish',
        'posts_per_page' => 1,
        'orderby'        => 'modified',
        'order'          => 'DESC',
        'tax_query'      => [
            [
                'taxonomy'         => $taxonomy,
                'terms'            => [$term_id],
                'include_children' => true,
            ],
        ],
    ]);

    if (!empty($posts)) {
        $modified = get_post_modified_time('c', true, $posts[0]);

        if ($modified) {
            $entry['lastmod'] = $modified;
        }
    }

    return $entry;
}, 999, 4);
