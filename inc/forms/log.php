<?php

if (!defined('ABSPATH')) {
    exit;
}

// Log the final CF7 result once, including validation failures and spam rejections.
add_action('wpcf7_submit', 'frame_cf7_log_submission', 10, 2);
function frame_cf7_log_submission($form, $result)
{
    $record = [
        'time_utc' => gmdate('c'),
        'form_id' => (int) $form->id(),
        'status' => (string) ($result['status'] ?? 'unknown'),
        'demo_mode' => !empty($result['demo_mode']),
        'invalid_fields' => array_keys($result['invalid_fields'] ?? []),
    ];

    // Never copy posted values, email bodies, IPs, tokens or attachments into the log.
    $line = wp_json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($line === false) {
        error_log('[frame CF7] Could not encode submission log entry.');
        return;
    }

    $path = WP_CONTENT_DIR . '/themes/cf7-submissions.txt';
    if (is_link($path)) {
        error_log('[frame CF7] Refusing to write submission log through a symbolic link.');
        return;
    }

    // Handle failures explicitly without leaking filesystem warnings into CF7's JSON response.
    $file = @fopen($path, 'c+b');
    if ($file === false) {
        error_log('[frame CF7] Could not open submission log. Check themes directory permissions.');
        return;
    }

    try {
        if (!flock($file, LOCK_EX)) {
            error_log('[frame CF7] Could not lock submission log.');
            return;
        }

        if (fseek($file, 0, SEEK_END) !== 0) {
            error_log('[frame CF7] Could not seek submission log.');
            return;
        }

        $entry = $line . "\n";
        $length = strlen($entry);
        $offset = 0;
        while ($offset < $length) {
            $written = @fwrite($file, substr($entry, $offset));
            if ($written === false || $written === 0) {
                error_log('[frame CF7] Could not write submission log.');
                return;
            }
            $offset += $written;
        }
        if (!fflush($file)) error_log('[frame CF7] Could not flush submission log.');
    } finally {
        // Closing also releases the exclusive lock, including on failure.
        fclose($file);
    }
}
