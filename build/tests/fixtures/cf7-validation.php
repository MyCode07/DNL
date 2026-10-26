<?php
$filters = [];
function add_filter($name, $callback, ...$rest) { $GLOBALS['filters'][$name] = $callback; }
function add_action(...$args) {}
function wpcf7_get_message($type) { return $type; }
function get_bloginfo($name) { return 'ru-RU'; }
if (!function_exists('mb_strlen')) {
    function mb_strlen($value) { return preg_match_all('/./us', $value); }
}
class Tag {
    public function __construct(public string $name, public string $basetype = 'text', public bool $required = false) {}
    public function is_required() { return $this->required; }
}
class WPCF7_ContactForm {
    public static array $tags = [];
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
check(validate('phone', '+44 (20) 7946-0018', 'tel') === [], 'Accept and normalize international formatting');
check(WPCF7_Submission::$data['phone'] === '+442079460018', 'Send the canonical number to mail');
foreach (['123', '4155552671', '+00000000000', '+1234567890123456', '+1 letters'] as $value) {
    check(isset(validate('phone', $value, 'tel')['phone']), 'Reject malformed phone: ' . $value);
}
check(validate('company', 'Studio 54') === [], 'Do not restrict company names');
echo "CF7 validation passed\n";
