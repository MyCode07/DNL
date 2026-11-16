<?php
define('ABSPATH', __DIR__);
define('WP_CONTENT_DIR', $argv[1]);
function add_action($hook, $callback, $priority, $args) {
    if ($hook !== 'wpcf7_submit' || $args !== 2) throw new RuntimeException('Wrong CF7 hook');
    $GLOBALS['submit_callback'] = $callback;
}
function wp_json_encode($value, $flags) { return json_encode($value, $flags); }
require dirname(__DIR__, 3) . '/inc/forms/log.php';
$form = new class {
    public function id() { return 9; }
};
foreach (['mail_sent', 'mail_failed', 'validation_failed', 'spam', 'aborted'] as $status) {
    ($GLOBALS['submit_callback'])($form, [
        'status' => $status,
        'invalid_fields' => $status === 'validation_failed' ? ['email' => ['reason' => 'Invalid email']] : [],
        'posted_data' => ['email' => 'private@example.test'],
        'posted_data_hash' => 'private-token',
    ]);
}
