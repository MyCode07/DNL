<?php

add_filter('wpseo_sitemap_url', function ($output, $url) {

    if (empty($url['loc'])) {
        return $output;
    }

    $loc  = $url['loc'];
    $path = wp_parse_url($loc, PHP_URL_PATH);

    // Default priority
    $priority = '0.7';

    // Homepage
    $homepages = [
        home_url('/'),
        home_url('/en/'),
    ];

    if (in_array(untrailingslashit($loc), array_map('untrailingslashit', $homepages), true)) {
        $priority = '1.0';
    } else {
        // Categories and subcategories
        $term = null;

        foreach (['category', 'product_cat'] as $taxonomy) {
            $candidate = get_term_by('slug', basename(untrailingslashit($path)), $taxonomy);

            if ($candidate instanceof WP_Term && get_term_link($candidate) === $loc) {
                $term = $candidate;
                break;
            }
        }

        if ($term) {
            $priority = $term->parent ? '0.8' : '0.9';
        }
    }

    $fields = "\t<changefreq>weekly</changefreq>\n";
    $fields .= "\t\t<priority>{$priority}</priority>\n";

    return str_replace('</url>', $fields . "\t</url>", $output);
}, 10, 2);


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

    $groups = [];
    foreach ($urls as $entry) {
        $groups[$entry['type']][] = $entry;
    }

    // Keep the main content sections first; custom types follow them.
    $groups = array_replace(array_fill_keys(['page', 'category', 'post', 'post_tag', 'author'], []), $groups);
?>
    <!DOCTYPE html>
    <html lang="ru">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Карта сайта</title>
        <link rel="stylesheet" href="<?php echo esc_url(get_theme_file_uri('dist/css/style.min.css')); ?>">
        <style>
            main {
                width: 100%;
                max-width: 90rem;
                margin-inline: auto;
                padding: 8rem 1.6rem;
            }

            h1 {
                margin-bottom: 6rem;
            }

            h1,
            h1.h2,
            h2.h3,
            h2 {
                text-transform: none;
            }

            ul {
                padding-left: 1.5em;
                margin: 2rem 0 4rem 0;

                li {
                    list-style: disc;

                    &:not(:last-child) {
                        margin-bottom: 0.6rem;
                    }
                }
            }
        </style>
    </head>

    <body class="sitemap">
        <main>
            <h1 class="h2">Карта сайта / Sitemap</h1>
            <?php foreach ($groups as $type => $entries): ?>
                <?php if (!$entries) continue; ?>
                <section>
                    <h2 class="h3"><?php echo esc_html(dnl_html_sitemap_group_title($type)); ?></h2>
                    <ul>
                        <?php foreach ($entries as $entry): ?>
                            <li><a href="<?php echo esc_url($entry['loc']); ?>"><?php echo esc_html($entry['title']); ?></a></li>
                        <?php endforeach; ?>
                    </ul>
                </section>
            <?php endforeach; ?>
        </main>
    </body>

    </html>
<?php
    exit;
});
