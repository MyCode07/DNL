<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Temporary CF7 + WordPress Mail + SMTP diagnostics.
 *
 * Remove after debugging.
 * Keep the log file inaccessible over HTTP.
 */

function frame_mail_request_id()
{
    static $id = null;

    if ($id === null) {
        $id = wp_generate_uuid4();
    }

    return $id;
}

function frame_mail_safe_error($message)
{
    $message = (string) $message;

    // Redact email addresses and common credential fields.
    $message = preg_replace(
        '/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i',
        '[EMAIL]',
        $message
    );

    $message = preg_replace(
        '/(password|passwd|token|secret|authorization)\s*[:=]\s*\S+/i',
        '$1=[REDACTED]',
        $message
    );

    return substr($message, 0, 500);
}

function frame_mail_log($event, array $data = [])
{
    $record = [
        'time_utc'   => gmdate('c'),
        'request_id' => frame_mail_request_id(),
        'event'      => $event,
        'data'       => $data,
    ];

    $line = wp_json_encode(
        $record,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    if ($line === false) {
        error_log('[frame CF7] JSON encoding failed');
        return;
    }

    $path = WP_CONTENT_DIR . '/themes/cf7-submissions.log';

    if (is_link($path)) {
        error_log('[frame CF7] Log path is a symbolic link');
        return;
    }

    $file = @fopen($path, 'c+b');

    if ($file === false) {
        error_log('[frame CF7] Cannot open log file');
        return;
    }

    try {
        if (!flock($file, LOCK_EX)) {
            return;
        }

        if (fseek($file, 0, SEEK_END) !== 0) {
            return;
        }

        $entry = $line . "\n";
        $offset = 0;
        $length = strlen($entry);

        while ($offset < $length) {
            $written = @fwrite(
                $file,
                substr($entry, $offset)
            );

            if ($written === false || $written === 0) {
                error_log('[frame CF7] Log write failed');
                return;
            }

            $offset += $written;
        }

        if (!fflush($file)) {
            error_log('[frame CF7] Log flush failed');
        }
    } finally {
        fclose($file);
    }
}


/**
 * 1. CF7: before mail processing.
 */

add_action('wpcf7_before_send_mail', function ($form) {

    frame_mail_log('cf7_before_send_mail', [
        'form_id' => (int) $form->id(),
    ]);
}, 10, 1);


/**
 * 2. CF7: mail accepted.
 */

add_action('wpcf7_mail_sent', function ($form) {

    frame_mail_log('cf7_mail_sent', [
        'form_id' => (int) $form->id(),
    ]);
}, 10, 1);


/**
 * 3. CF7: mail failed.
 */

add_action('wpcf7_mail_failed', function ($form) {

    frame_mail_log('cf7_mail_failed', [
        'form_id' => (int) $form->id(),
    ]);
}, 10, 1);


/**
 * 4. CF7: final submission result.
 */

add_action('wpcf7_submit', function ($form, $result) {

    frame_mail_log('cf7_submit', [
        'form_id' => (int) $form->id(),
        'status' => (string) ($result['status'] ?? 'unknown'),
        'demo_mode' => !empty($result['demo_mode']),
        'invalid_fields' => array_keys(
            $result['invalid_fields'] ?? []
        ),
    ]);
}, 10, 2);


/**
 * 5. WordPress: wp_mail() invoked.
 *
 * Never log message bodies, subjects, headers
 * or recipient addresses.
 */

add_filter('wp_mail', function ($args) {

    frame_mail_log('wp_mail_called', [
        'has_recipients' => !empty($args['to']),
        'has_subject' => !empty($args['subject']),
        'has_message' => !empty($args['message']),
        'attachment_count' => count(
            (array) ($args['attachments'] ?? [])
        ),
    ]);

    return $args;
}, 9999);


/**
 * 6. WordPress: mail sending was short-circuited.
 *
 * Some plugins bypass PHPMailer entirely.
 */

add_filter('pre_wp_mail', function ($return, $atts) {

    if ($return !== null) {
        frame_mail_log('wp_mail_short_circuited', [
            'result' => (bool) $return,
        ]);
    }

    return $return;
}, PHP_INT_MAX, 2);


/**
 * 7. PHPMailer configuration.
 *
 * Run late to inspect SMTP plugin configuration.
 */

add_action('phpmailer_init', function ($mailer) {

    frame_mail_log('phpmailer_initialized', [
        'mailer' => (string) $mailer->Mailer,
        'host' => (string) $mailer->Host,
        'port' => (int) $mailer->Port,
        'smtp_auth' => (bool) $mailer->SMTPAuth,
        'smtp_secure' => (string) $mailer->SMTPSecure,
        'smtp_auto_tls' => (bool) $mailer->SMTPAutoTLS,
        'from_matches_username' =>
        !empty($mailer->Username) &&
            strcasecmp(
                $mailer->From,
                $mailer->Username
            ) === 0,
    ]);

    /**
     * SMTP protocol diagnostics.
     *
     * Capture only SMTP server reply status codes.
     * Never capture CLIENT -> SERVER commands because
     * they can contain authentication data or mail bodies.
     */

    if (strtolower((string) $mailer->Mailer) !== 'smtp') {
        return;
    }

    $mailer->SMTPDebug = 2;

    $mailer->Debugoutput = function ($message, $level) {

        if (stripos($message, 'SERVER -> CLIENT:') === false) {
            return;
        }

        // Strip the protocol prefix and read only SMTP status.
        $response = trim(
            substr(
                $message,
                stripos($message, 'SERVER -> CLIENT:') + 17
            )
        );

        if (preg_match('/^([245]\d{2})([ -])/', $response, $m)) {
            frame_mail_log('smtp_server_response', [
                'smtp_code' => (int) $m[1],
                'continuation' => $m[2] === '-',
            ]);
        }
    };
}, 99999, 1);


/**
 * 8. WordPress: PHPMailer succeeded.
 *
 * This means the send operation succeeded,
 * NOT that the recipient received the message.
 */

add_action('wp_mail_succeeded', function ($mail_data) {

    frame_mail_log('wp_mail_succeeded', [
        'result' => true,
    ]);
}, 10, 1);


/**
 * 9. WordPress: PHPMailer failed.
 */

add_action('wp_mail_failed', function ($error) {

    $data = $error->get_error_data();

    frame_mail_log('wp_mail_failed', [
        'error_code' => $error->get_error_code(),
        'error_message' => frame_mail_safe_error(
            $error->get_error_message()
        ),
        'exception_code' => is_array($data)
            ? ($data['phpmailer_exception_code'] ?? null)
            : null,
    ]);
}, 10, 1);
