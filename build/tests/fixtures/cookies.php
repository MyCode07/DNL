<?php
function is_ssl() { return true; }
function add_shortcode(...$args) {}
function shortcode_atts($defaults, $atts, $name) { return array_merge($defaults, $atts); }
function esc_attr($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function esc_html($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
require $argv[1] . '/inc/ajax/cookies.php';
require $argv[1] . '/inc/wp/shortcodes.php';
function check($condition, $message) {
    if (!$condition) throw new RuntimeException($message);
}
function input($atts) {
    preg_match('/<input\b[^>]*>/', custom_checkbox_shortcode($atts), $match);
    return $match[0];
}
check(Cookies::LIFETIME === 2592000, 'Use thirty days');
check(Cookies::set('cookie', true) === true, 'Return write success');
check(Cookies::get('cookie') === '1', 'Make the accepted value available immediately');
check(Cookies::update('cookie_stats', false) === true, 'Return update success');
check(Cookies::get('cookie_stats') === '0', 'Preserve an explicit opt-out');
check(!preg_match('/\schecked(?:\s|>)/', input(['name' => 'cookie_stats', 'checked' => 'true'])), 'Restore saved unchecked state');
Cookies::update('cookie_stats', true);
check(preg_match('/\schecked(?:\s|>)/', input(['name' => 'cookie_stats'])), 'Restore saved checked state');
Cookies::update('cookie_required', false);
check(preg_match('/\schecked(?:\s|>)/', input(['name' => 'cookie_required', 'checked' => 'true', 'disabled' => 'true'])), 'Preserve disabled defaults');
check(preg_match('/\schecked(?:\s|>)/', input(['name' => 'cookie_required', 'checked' => 'true', 'readonly' => 'true'])), 'Preserve readonly defaults');
Cookies::set('newsletter', true);
check(!preg_match('/\schecked(?:\s|>)/', input(['name' => 'newsletter'])), 'Do not restore unrelated fields');
check(Cookies::delete('cookie_stats') === true, 'Return delete success');
check(Cookies::get('cookie_stats') === null, 'Delete from the current request too');
$_COOKIE['cookie_array'] = ['unexpected'];
check(Cookies::get('cookie_array') === null, 'Ignore malformed array values');
check(!function_exists('cookie_action'), 'Do not register the unused consent AJAX endpoint');
echo "Cookie PHP checks passed\n";
