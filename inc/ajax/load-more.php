<?php
if (!defined('ABSPATH')) {
    exit;
}

/** Reuse the same query for archives and custom page loops. */
function frame_load_more_config(WP_Query $query, string $template = 'post'): array
{
    $keys = [
        'post_type', 'posts_per_page', 'order', 'orderby', 'ignore_sticky_posts',
        'cat', 'category_name', 'category__in', 'category__not_in', 'category__and',
        'tag', 'tag_id', 'tag__in', 'tag__not_in', 'tag__and', 'tag_slug__in', 'tag_slug__and',
        'taxonomy', 'term', 'tax_query', 'author', 'author_name', 'author__in', 'author__not_in',
        'year', 'monthnum', 'day', 'm', 'date_query', 's', 'post__in', 'post__not_in',
        'meta_key', 'meta_value', 'meta_query',
    ];
    $args = array_intersect_key($query->query_vars, array_flip($keys));
    $args['post_type'] = $args['post_type'] ?: 'post';
    if ($args['post_type'] === 'any') {
        $args['post_type'] = array_values(get_post_types(['public' => true, 'exclude_from_search' => false]));
    }
    $args['posts_per_page'] = (int) $query->get('posts_per_page');
    $args['post_status'] = 'publish';
    $args['suppress_filters'] = false;
    $lang = $query->get('lang') ?: (function_exists('pll_current_language') ? pll_current_language('slug') : '');
    if ($lang) {
        $args['lang'] = $lang;
    }
    // Signed settings keep public requests from changing the query or template path.
    // Unlike a user nonce, this read-only configuration also survives page caching.
    $payload = wp_json_encode([
        'query' => $args,
        'template' => $template,
        'max_pages' => (int) $query->max_num_pages,
    ]);
    return [
        'url' => admin_url('admin-ajax.php'),
        'query' => $payload,
        'signature' => hash_hmac('sha256', $payload, wp_salt('auth')),
        'page' => max(1, (int) $query->get('paged')),
        'lang' => $lang ?: '',
    ];
}

add_action('wp_ajax_frame_load_more', 'frame_ajax_load_more');
add_action('wp_ajax_nopriv_frame_load_more', 'frame_ajax_load_more');

function frame_ajax_load_more(): void
{
    $payload = isset($_POST['query']) && is_string($_POST['query']) ? wp_unslash($_POST['query']) : '';
    $signature = isset($_POST['signature']) && is_string($_POST['signature']) ? $_POST['signature'] : '';
    $page = isset($_POST['page']) && is_scalar($_POST['page'])
        ? filter_var($_POST['page'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 2]]) : false;
    if (!$page || !$payload || !hash_equals(hash_hmac('sha256', $payload, wp_salt('auth')), $signature)) {
        wp_send_json_error(['message' => 'Invalid pagination request.'], 400);
    }
    $config = json_decode($payload, true);
    if (!is_array($config) || !isset($config['query'], $config['template'], $config['max_pages'])) {
        wp_send_json_error(['message' => 'Invalid query configuration.'], 400);
    }
    $args = $config['query'];
    foreach ((array) $args['post_type'] as $type) {
        $object = get_post_type_object($type);
        if (!$object || !$object->public) {
            wp_send_json_error(['message' => 'Unsupported post type.'], 400);
        }
    }
    if ($args['posts_per_page'] < 1 || $page > $config['max_pages']) {
        wp_send_json_success(['html' => '', 'page' => $page, 'has_more' => false]);
    }
    $args['paged'] = $page;
    $args['post_status'] = 'publish';
    $posts = new WP_Query($args);
    ob_start();
    while ($posts->have_posts()) {
        $posts->the_post();
        get_template_part('template-parts/post-cards/' . $config['template']);
    }
    $html = ob_get_clean();
    wp_reset_postdata();
    wp_send_json_success([
        'html' => $html,
        'page' => $page,
        'has_more' => $posts->post_count > 0 && $page < min($posts->max_num_pages, $config['max_pages']),
    ]);
}
