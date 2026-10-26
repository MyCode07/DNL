<?php
// Isolate the AJAX contract from the database; browser checks cover real WordPress.
define('ABSPATH', __DIR__);
function add_action(...$args) {}
function wp_json_encode($value) { return json_encode($value); }
function wp_salt($scheme) { return 'test-only-signing-key'; }
function admin_url($path) { return '/wp-admin/' . $path; }
function pll_current_language($format) { return 'ru'; }
function wp_unslash($value) { return stripslashes($value); }
function get_post_type_object($type) { return (object) ['public' => $type === 'post']; }
function get_post_types($args) { return ['post' => 'post']; }
function wp_reset_postdata() { $GLOBALS['reset'] = true; }
function get_template_part($path) { echo '<article>' . $path . '</article>'; }
class AjaxResult extends Exception {
    public function __construct(public array $result, public int $status = 200) {}
}
function wp_send_json_success($data) { throw new AjaxResult(['success' => true, 'data' => $data]); }
function wp_send_json_error($data, $status) { throw new AjaxResult(['success' => false, 'data' => $data], $status); }
class WP_Query {
    public array $query_vars;
    public int $max_num_pages = 3;
    public int $post_count = 2;
    private int $index = 0;
    public function __construct(array $args) {
        $this->query_vars = $args;
        $GLOBALS['last_query'] = $args;
    }
    public function get($key) { return $this->query_vars[$key] ?? ''; }
    public function have_posts() { return $this->index < $this->post_count; }
    public function the_post() { $this->index++; }
}
require $argv[1];
function check($condition, $message) {
    if (!$condition) throw new RuntimeException($message);
}
function request($config, $page, $overrides = []) {
    $_POST = array_merge([
        'query' => addslashes($config['query']),
        'signature' => $config['signature'],
        'page' => (string) $page,
    ], $overrides);
    try { frame_ajax_load_more(); }
    catch (AjaxResult $result) { return $result; }
    throw new RuntimeException('Request did not return JSON');
}
$query = new WP_Query([
    'post_type' => 'post', 'posts_per_page' => 2, 'paged' => 1,
    'category_name' => 'investments', 'tax_query' => [['taxonomy' => 'post_tag', 'terms' => [7]]],
    'order' => 'DESC', 'orderby' => 'date', 'post_status' => 'private',
]);
$config = frame_load_more_config($query);
$result = request($config, 2);
check($result->result['success'] === true, 'Page two must succeed');
check($result->result['data']['has_more'] === true, 'Page two has another page');
check(substr_count($result->result['data']['html'], '<article>') === 2, 'Render the shared card template');
check($GLOBALS['last_query']['category_name'] === 'investments', 'Keep category');
check($GLOBALS['last_query']['tax_query'][0]['terms'] === [7], 'Keep taxonomy filters');
check($GLOBALS['last_query']['lang'] === 'ru', 'Keep Polylang language');
check($GLOBALS['last_query']['post_status'] === 'publish', 'Never return private posts');
check($GLOBALS['last_query']['paged'] === 2 && $GLOBALS['last_query']['posts_per_page'] === 2, 'Keep page size and page');
check($GLOBALS['reset'] === true, 'Restore global post data');
check(request($config, 3)->result['data']['has_more'] === false, 'Last page removes the button');
check(request($config, 4)->result['data']['html'] === '', 'Exhausted query returns no cards');
check(request($config, 0)->status === 400, 'Reject invalid page');
check(request($config, '2.5')->status === 400, 'Reject fractional page');
check(request($config, 2, ['signature' => 'tampered'])->status === 400, 'Reject invalid signature');
check(request($config, 2, ['query' => addslashes(str_replace('investments', 'other', $config['query']))])->status === 400, 'Reject altered query');
$query->query_vars['post_type'] = 'any';
check(request(frame_load_more_config($query), 2)->result['success'] === true, 'Resolve public types for taxonomy archives');
$query->query_vars['lang'] = 'en';
request(frame_load_more_config($query), 2);
check($GLOBALS['last_query']['lang'] === 'en', 'Keep explicit custom query language');
$query->query_vars['post_type'] = 'private_type';
check(request(frame_load_more_config($query), 2)->status === 400, 'Reject nonpublic types');
echo "AJAX contract passed: paging, rendering, filters, language, public status and tamper protection.\n";
