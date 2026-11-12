<?php
$filters = [];
function add_filter($name, $callback, ...$rest) { $GLOBALS['filters'][$name] = $callback; }
function add_action($name, $callback, ...$rest) { $GLOBALS['actions'][$name][] = $callback; }
function register_setting($group, $name, $args) { $GLOBALS['registered_setting'] = [$group, $name, $args]; }
function add_submenu_page(...$args) { $GLOBALS['registered_menu'] = $args; }
function wpcf7_get_message($type) { return $type; }
function get_bloginfo($name) { return 'ru-RU'; }
function get_option($name, $default = false) { return $GLOBALS['options'][$name] ?? $default; }
function sanitize_textarea_field($value) { return trim(strip_tags($value)); }
function wp_json_encode($value) { return json_encode($value); }
function PLL() { return $GLOBALS['polylang']; }
function current_user_can($capability) { return true; }
function esc_attr($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function esc_html($value) { return esc_attr($value); }
function esc_textarea($value) { return esc_attr($value); }
function settings_errors(...$args) {}
function settings_fields(...$args) {}
function submit_button() {}
if (!function_exists('mb_strlen')) {
    function mb_strlen($value) { return preg_match_all('/./us', $value); }
}
class Tag {
    public function __construct(public string $name, public string $basetype = 'text', public bool $required = false) {}
    public function is_required() { return $this->required; }
}
class WPCF7_ContactForm {
    public static array $tags = [];
    public static string $language = 'ru_RU';
    public function locale() { return self::$language; }
    public function message($key) { return $GLOBALS['filters']['wpcf7_display_message']('CF7: ' . $key, $key); }
    public static function get_current() { return new self(); }
    public function scan_form_tags() { return self::$tags; }
}
class WPCF7_Submission {
    public static array $data = [];
    public static function get_instance() { return new self(); }
    public function get_posted_data($name) { return self::$data[$name] ?? null; }
}
class Validation {
    public array $errors = [];
    public function invalidate($tag, $message) { $this->errors[$tag->name] = $message; }
}
function check($condition, $message) { if (!$condition) throw new RuntimeException($message); }
require $argv[1];
$tag = $filters['wpcf7_form_tag'](['name' => 'cname', 'basetype' => 'text', 'options' => ['maxlength:500', 'minlength:2']]);
check($tag['options'] === ['minlength:2', 'maxlength:40'], 'Enforce the rendered limit and schema');
$phone_tag = $filters['wpcf7_form_tag'](['name' => 'phone', 'type' => 'text*', 'basetype' => 'text', 'options' => []]);
check($phone_tag['type'] === 'tel*' && $phone_tag['basetype'] === 'tel', 'Upgrade existing text phone fields without editing records');
function validate($name, $value, $type = 'text', $required = true) {
    $tag = new Tag($name, $type, $required);
    WPCF7_ContactForm::$tags = [$tag];
    WPCF7_Submission::$data = $GLOBALS['filters']['wpcf7_posted_data']([$name => $value]);
    $result = new Validation();
    $GLOBALS['filters']['wpcf7_validate']($result, [$tag]);
    return $result->errors;
}
foreach (['cname', 'location'] as $name) {
    foreach (['Анна-Мария', 'O’Connor', 'Հայաստան', 'São Paulo', 'United States', str_repeat('А', 40)] as $value) {
        check(validate($name, $value) === [], 'Accept letters: ' . $value);
    }
    foreach (['Иван2', 'Paris ٢', 'Москва!', 'John@example', '-----', '😀 City', str_repeat('А', 41)] as $value) {
        check(isset(validate($name, $value)[$name]), 'Reject invalid value: ' . $value);
    }
    check(validate($name, '', 'text', false) === [], 'Allow an empty optional field');
    check(isset(validate($name, ' ')[$name]), 'Reject a blank required field');
}
foreach (['123', '4155552671', '+00000000000', '+1234567890123456'] as $value) {
    check(validate('phone', $value, 'tel') === [], 'Accept digits with optional leading plus');
    check(WPCF7_Submission::$data['phone'] === $value, 'Keep the entered number unchanged');
}
check(validate('phone', '', 'tel', false) === [], 'Allow an empty optional phone');
foreach (['+', '12+34', '++123', '+44 (20) 7946-0018', '+1 letters'] as $value) {
    check(isset(validate('phone', $value, 'tel')['phone']), 'Reject malformed phone: ' . $value);
}
check(validate('company', 'Studio 54') === [], 'Do not restrict company names');
check(validate('cname', '123')['cname'] === 'invalid_alphabetic', 'Use the registered per-form message key');
$messages = $filters['wpcf7_messages']([]);
check(isset($messages['invalid_alphabetic']['description'], $messages['invalid_alphabetic']['default']), 'Expose the custom message in the CF7 editor');
// One setting must reach schema/message lookup and the client payload for all forms.
$GLOBALS['options']['frame_cf7_messages'] = [
    'ru' => ['invalid_email' => 'Общий email', 'invalid_alphabetic' => 'Только буквы'],
    'en' => ['invalid_email' => 'Shared email'],
];
$display = $filters['wpcf7_display_message'];
check($display('Original', 'invalid_email') === 'Общий email', 'Use Russian form locale');
$payload = json_decode($filters['wpcf7_form_hidden_fields']([])['_frame_cf7_messages'], true);
check($payload['invalid_email'] === 'Общий email', 'Client receives the same shared message');
check($payload['invalid_alphabetic'] === 'Только буквы', 'Include custom alphabetic validation');
check($display('Original', 'invalid_required') === 'Original', 'Unset values keep form messages');
WPCF7_ContactForm::$language = 'en-US';
check($display('Original', 'invalid_email') === 'Shared email', 'Use English locale, independent of site language');
$GLOBALS['options']['frame_cf7_messages']['en']['invalid_email'] = '  ';
check($display('Original', 'invalid_email') === 'Original', 'Blank values keep form messages');
WPCF7_ContactForm::$language = 'de_DE';
check($display('Original', 'invalid_email') === 'Original', 'Do not override other languages');
check($display('Original', 'mail_sent_ok') === 'Original', 'Only override the configured validation keys');
$clean = frame_cf7_sanitize_messages([
    'ru' => ['invalid_email' => '<b>Общий email</b>', 'invalid_tel' => ['bad']],
    'en' => ['invalid_email' => 'Shared email'],
    'unknown' => ['invalid_email' => 'discard'],
]);
check($clean['ru']['invalid_email'] === 'Общий email', 'Strip HTML from settings');
check($clean['ru']['invalid_tel'] === '', 'Reject malformed field values');
check(!isset($clean['unknown']), 'Whitelist languages');
check(count(frame_cf7_sanitize_messages(null)['ru']) === count(frame_cf7_message_labels()), 'Handle absent settings');
define('WPCF7_VERSION', '6.2.3');
$GLOBALS['admin_page_hooks'] = ['wpcf7-dashboard' => 'contact'];
foreach ($GLOBALS['actions']['admin_menu'] as $callback) $callback();
check($GLOBALS['registered_menu'][0] === 'wpcf7-dashboard', 'Place the page under the current CF7 menu');
check($GLOBALS['registered_menu'][3] === 'manage_options', 'Only administrators manage shared messages');
$GLOBALS['admin_page_hooks'] = ['wpcf7' => 'contact'];
foreach ($GLOBALS['actions']['admin_menu'] as $callback) $callback();
check($GLOBALS['registered_menu'][0] === 'wpcf7', 'Support the legacy CF7 menu');
foreach ($GLOBALS['actions']['admin_init'] as $callback) $callback();
check($GLOBALS['registered_setting'][2]['sanitize_callback'] === 'frame_cf7_sanitize_messages', 'Use the sanitizer when saving through WordPress');
foreach (['ru', 'en', ''] as $selected) {
    $GLOBALS['polylang'] = (object) ['filter_lang' => $selected ? (object) ['slug' => $selected] : false];
    ob_start();
    frame_cf7_messages_page();
    $html = ob_get_clean();
    foreach (['ru', 'en'] as $language) {
        $hidden = $selected && $selected !== $language ? ' hidden' : '';
        check(str_contains($html, 'data-cf7-message-language="' . $language . '"' . $hidden . '>'), 'Show only the selected toolbar language, or all when unset');
        check(str_contains($html, 'name="frame_cf7_messages[' . $language . '][invalid_email]"'), 'Hidden language fields remain in the submitted form');
    }
    check(substr_count($html, '<textarea') === 18, 'Render all fields regardless of the active language');
}
echo "CF7 validation passed\n";
