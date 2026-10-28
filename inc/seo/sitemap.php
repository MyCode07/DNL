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

// Register /sitemap.html
add_action('init', function () {
    add_rewrite_rule(
        '^sitemap\.html$',
        'index.php?custom_html_sitemap=1',
        'top'
    );
});

add_filter('query_vars', function ($vars) {
    $vars[] = 'custom_html_sitemap';
    return $vars;
});

// Yoast supplies the original object, so translated titles do not need HTTP requests.
function dnl_html_sitemap_entry_title($entry, $type, $object)
{
    if (empty($entry['loc'])) {
        return $entry;
    }

    if ($type === 'post') {
        $entry['title'] = get_the_title($object);
        $entry['post_type'] = $object->post_type;
    } elseif ($type === 'term') {
        $entry['title'] = $object->name;
    } elseif ($type === 'user') {
        $entry['title'] = $object->display_name;
    }

    return $entry;
}

function dnl_html_sitemap_title($entry, $type)
{
    $title = $entry['title'] ?? '';

    // Yoast's first links (front page and post-type archives) bypass the entry filter.
    if ($title === '') {
        $post_id = url_to_postid($entry['loc']);
        if ($post_id) {
            $title = get_the_title($post_id);
        } elseif (untrailingslashit($entry['loc']) === untrailingslashit(home_url('/'))) {
            $title = get_bloginfo('name');
        } elseif (get_post_type_archive_link($type) === $entry['loc']) {
            $posts_page = $type === 'post' ? (int) get_option('page_for_posts') : 0;
            $post_type = get_post_type_object($type);
            $title = $posts_page ? get_the_title($posts_page) : ($post_type->labels->name ?? '');
        }
    }

    $title = trim(html_entity_decode(wp_strip_all_tags($title), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    return $title !== '' ? $title : __('Без названия', 'frame');
}

function dnl_html_sitemap_group_title($type)
{
    $titles = [
        'page' => __('Страницы', 'frame'),
        'category' => __('Категории', 'frame'),
        'post' => __('Публикации', 'frame'),
        'post_tag' => __('Метки', 'frame'),
        'author' => __('Авторы', 'frame'),
    ];
    if (isset($titles[$type])) {
        return $titles[$type];
    }

    $object = get_post_type_object($type) ?: get_taxonomy($type);
    return $object->labels->name ?? $type;
}

// Use Yoast's providers to preserve its exclusions and pagination without fetching XML.
function dnl_read_sitemap()
{
    if (
        !class_exists('WPSEO_Post_Type_Sitemap_Provider') ||
        !class_exists('WPSEO_Taxonomy_Sitemap_Provider') ||
        !class_exists('WPSEO_Author_Sitemap_Provider')
    ) {
        return [];
    }

    $providers = [
        new WPSEO_Post_Type_Sitemap_Provider(),
        new WPSEO_Taxonomy_Sitemap_Provider(),
        new WPSEO_Author_Sitemap_Provider(),
    ];

    $limit = (int) apply_filters(
        'wpseo_sitemap_entries_per_page',
        1000
    );

    if ($limit < 1) {
        return [];
    }

    $index = [];

    foreach ($providers as $provider) {
        $index = array_merge(
            $index,
            $provider->get_index_links($limit)
        );
    }

    $index = apply_filters('wpseo_sitemap_index_links', $index);

    $urls = [];

    add_filter('wpseo_sitemap_entry', 'dnl_html_sitemap_entry_title', PHP_INT_MAX, 3);
    try {
        foreach ($index as $sitemap) {
            if (empty($sitemap['loc'])) {
                continue;
            }

            $path = wp_parse_url($sitemap['loc'], PHP_URL_PATH);
            $name = basename($path ?: '');

            if (!preg_match(
                '/^(.+)-sitemap([0-9]*)\.xml$/',
                $name,
                $matches
            )) {
                continue;
            }

            $type = $matches[1];
            $page = !empty($matches[2])
                ? (int) $matches[2]
                : 1;

            foreach ($providers as $provider) {
                if (!$provider->handles_type($type)) {
                    continue;
                }

                try {
                    $entries = $provider->get_sitemap_links(
                        $type,
                        $limit,
                        $page
                    );

                    foreach ($entries as $entry) {
                        if (empty($entry['loc'])) {
                            continue;
                        }

                        $entry_type = $entry['post_type'] ?? $type;
                        // The blog index is a page even though Yoast lists it in post-sitemap.xml.
                        if ($type === 'post' && !isset($entry['post_type'])) {
                            $post_id = url_to_postid($entry['loc']);
                            if (
                                ($post_id && get_post_type($post_id) === 'page')
                                || untrailingslashit($entry['loc']) === untrailingslashit((string) get_post_type_archive_link('post'))
                            ) {
                                $entry_type = 'page';
                            }
                        }

                        if (!isset($urls[$entry['loc']]) || $entry_type === 'page') {
                            $urls[$entry['loc']] = [
                                'loc' => $entry['loc'],
                                'title' => dnl_html_sitemap_title($entry, $type),
                                'type' => $entry_type,
                            ];
                        }
                    }
                } catch (OutOfBoundsException $e) {
                    error_log($e->getMessage());
                }

                break;
            }
        }
    } finally {
        remove_filter('wpseo_sitemap_entry', 'dnl_html_sitemap_entry_title', PHP_INT_MAX);
    }

    ksort($urls, SORT_STRING);
    return array_values($urls);
}

// Render HTML Sitemap
add_action('template_redirect', function () {
    if (!get_query_var('custom_html_sitemap')) {
        return;
    }

    if (!class_exists('WPSEO_Options')) {
        status_header(503);
        exit('Yoast SEO is not available.');
    }

    $urls = dnl_read_sitemap();

    if (!$urls) {
        status_header(503);
        exit('Unable to load XML Sitemap.');
    }

    status_header(200);
    nocache_headers();
    header('Content-Type: text/html; charset=UTF-8');

    echo '<!DOCTYPE html>';
    echo '<html lang="ru">';
    echo '<head>';
    echo '<meta charset="UTF-8">';
    echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
    echo '<title>Карта сайта</title>';
    printf('<link rel="stylesheet" href="%s">', esc_url(get_theme_file_uri('dist/css/style.min.css')));
    echo '</head>';
    echo '<body class="sitemap">';

    echo '<main>';
    echo '<h1>Карта сайта / Sitemap</h1>';
    $groups = [];
    foreach ($urls as $entry) {
        $groups[$entry['type']][] = $entry;
    }

    // Keep the main content sections first; custom types follow them.
    $groups = array_replace(array_fill_keys(['page', 'category', 'post', 'post_tag', 'author'], []), $groups);
    foreach ($groups as $type => $entries) {
        if (!$entries) {
            continue;
        }
        echo '<section>';
        printf('<h2>%s</h2><ul>', esc_html(dnl_html_sitemap_group_title($type)));
        foreach ($entries as $entry) {
            printf(
                '<li><a href="%s">%s</a></li>',
                esc_url($entry['loc']),
                esc_html($entry['title'])
            );
        }
        echo '</ul></section>';
    }

    echo '</main>';
    echo '</body></html>';

    exit;
});
