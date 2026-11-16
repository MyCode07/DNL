<?php
error_reporting(E_ALL);
set_error_handler(static function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});
define('ABSPATH', __DIR__);
function add_filter(...$args) {}
function pll_current_language($format) { return $GLOBALS['language']; }
function get_field($field, $object) {
    if ($object !== 'user_7') throw new RuntimeException('Wrong author');
    return $GLOBALS['fields'][$field] ?? false;
}
function get_the_author_meta($field, $id = 7) { return $field === 'ID' ? 7 : 'Profile name'; }
function wp_strip_all_tags($value) { return strip_tags($value); }
function esc_html($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function esc_url($value) { return esc_html($value); }
function get_localized_field($field) { return $field; }
function get_the_category() { return []; }
function get_the_date($format) { return '16 Nov. 2026'; }
function the_permalink() { echo '/article/'; }
function the_title() { echo 'Article'; }
function has_post_thumbnail() { return true; }
function the_post_thumbnail() {}
function get_loop_custom_excerpt() { return 'Excerpt'; }

$theme = dirname(__DIR__, 3);
require $theme . '/inc/acf/author.php';
require $theme . '/inc/seo/yoast.php';
$GLOBALS['fields'] = [
    'imya' => 'Имя RU', 'imya_en' => 'Name & EN',
    'dolzhnost' => 'Должность RU', 'dolzhnost_en' => 'Role EN',
    'opisanie' => 'Описание RU', 'opisanie_en' => 'Biography EN',
];
$results = [];
foreach (['ru', 'en'] as $language) {
    $GLOBALS['language'] = $language;
    $values = frame_get_author_data(7);
    $schema = frame_yoast_author_data(['@id' => '#author', 'name' => 'Profile name'], 7);
    foreach ($values as $key => $value) {
        if ($schema[$key] !== $value) throw new RuntimeException('Schema differs from author values');
    }
    foreach (['single-post/author', 'post-cards/post'] as $template) {
        ob_start();
        include $theme . '/template-parts/' . $template . '.php';
        $html = ob_get_clean();
        if (!str_contains($html, esc_html($values['name'])) || str_contains($html, 'Profile name')) {
            throw new RuntimeException('Template did not use localized ACF name');
        }
        if ($template === 'single-post/author' && !str_contains($html, esc_html($values['description']))) {
            throw new RuntimeException('Biography did not use localized ACF description');
        }
    }
    $results[$language] = $values;
}
$GLOBALS['fields']['imya_en'] = ' ';
$GLOBALS['fields']['opisanie_en'] = '';
$results['fallback'] = frame_get_author_data(7);
$GLOBALS['fields']['imya'] = '';
$results['profile'] = frame_get_author_data(7)['name'];
echo json_encode($results, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
