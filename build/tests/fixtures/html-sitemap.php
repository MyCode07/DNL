<?php
error_reporting(E_ALL);
set_error_handler(static function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});
$filters = [];
$actions = [];
function add_action($name, $callback) { $GLOBALS['actions'][$name] = $callback; }
function add_filter($name, $callback, $priority = 10, $args = 1) { $GLOBALS['filters'][$name][$priority][] = $callback; }
function remove_filter($name, $callback, $priority = 10) {
    $GLOBALS['filters'][$name][$priority] = array_filter($GLOBALS['filters'][$name][$priority], static fn($item) => $item !== $callback);
}
function apply_filters($name, $value, ...$args) {
    $callbacks = $GLOBALS['filters'][$name] ?? [];
    ksort($callbacks);
    foreach ($callbacks as $group) foreach ($group as $callback) $value = $callback($value, ...$args);
    return $value;
}
function home_url($path = '/') { return 'https://example.test' . $path; }
function untrailingslashit($value) { return rtrim($value, '/'); }
function wp_parse_url($value, $component) { return parse_url($value, $component); }
function url_to_postid($url) { return ['https://example.test/' => 1, 'https://example.test/en/' => 2, 'https://example.test/en/blog/' => 4][$url] ?? 0; }
function get_the_title($post) { return is_object($post) ? $post->post_title : [1 => 'Главная', 2 => 'Home', 3 => 'Блог', 4 => 'Blog'][$post]; }
function get_post_type($post) { return 'page'; }
function get_option($name) { return $name === 'page_for_posts' ? 3 : 0; }
function get_theme_file_uri($path) { return 'https://example.test/wp-content/themes/frame/' . $path; }
function get_post_type_archive_link($type) { return ['book' => home_url('/books/'), 'post' => home_url('/blog/')][$type] ?? false; }
function get_post_type_object($type) { return (object) ['labels' => (object) ['name' => 'Books']]; }
function get_bloginfo($name) { return 'Example'; }
function wp_strip_all_tags($value) { return strip_tags($value); }
function __($value, $domain) { return $value; }
function esc_html($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function esc_url($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function get_query_var($name) { return true; }
function status_header($status) { if ($status !== 200) throw new RuntimeException('Unexpected status'); }
function nocache_headers() {}
class WPSEO_Options {}
class WPSEO_Post_Type_Sitemap_Provider {
    public function get_index_links($limit) {
        return array_map(static fn($name) => ['loc' => home_url('/' . $name . '.xml')], ['page-sitemap', 'post-sitemap', 'post-sitemap2', 'book-sitemap']);
    }
    public function handles_type($type) { return in_array($type, ['page', 'post', 'book'], true); }
    public function get_sitemap_links($type, $limit, $page) {
        if ($type === 'page') return [['loc' => home_url('/')], ['loc' => home_url('/en/')]];
        if ($type === 'book') return [['loc' => home_url('/books/')]];
        return $page === 1
            ? [apply_filters('wpseo_sitemap_entry', ['loc' => home_url('/article/')], 'post', (object) ['post_title' => '<b>Рынок</b> &amp; инвестиции', 'post_type' => 'post']), ['loc' => home_url('/')], ['loc' => home_url('/blog/')], ['loc' => home_url('/en/blog/')]]
            : [apply_filters('wpseo_sitemap_entry', ['loc' => home_url('/second/')], 'post', (object) ['post_title' => 'Second page', 'post_type' => 'post'])];
    }
}
class WPSEO_Taxonomy_Sitemap_Provider {
    public function get_index_links($limit) { return [['loc' => home_url('/category-sitemap.xml')]]; }
    public function handles_type($type) { return $type === 'category'; }
    public function get_sitemap_links($type, $limit, $page) {
        return [apply_filters('wpseo_sitemap_entry', ['loc' => home_url('/category/news/')], 'term', (object) ['name' => 'News & analysis'])];
    }
}
class WPSEO_Author_Sitemap_Provider {
    public function get_index_links($limit) { return [['loc' => home_url('/author-sitemap.xml')]]; }
    public function handles_type($type) { return $type === 'author'; }
    public function get_sitemap_links($type, $limit, $page) {
        return [apply_filters('wpseo_sitemap_entry', ['loc' => home_url('/author/editor/')], 'user', (object) ['display_name' => 'Editor'])];
    }
}
require $argv[1];
$entries = dnl_read_sitemap();
if (count($entries) !== 9) throw new RuntimeException('Lost pages or duplicate URLs');
if (!empty($filters['wpseo_sitemap_entry'][PHP_INT_MAX])) throw new RuntimeException('Temporary title filter was not removed');
$actions['template_redirect']();
