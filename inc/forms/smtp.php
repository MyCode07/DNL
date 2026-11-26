<?php


add_action('phpmailer_init', function ($phpmailer) {


    // $smtp_host = 'smtp.yandex.ru';
    // $smtp_port = 587;
    // $smtp_user = 'dev@chipsa.ru';
    // $smtp_pass = 'ypnihswvdinwvxyr';
    // $smtp_from = 'dev@chipsa.ru';
    // $smtp_from_name = 'DNL Capital';

    $smtp_host = 'smtp.yandex.ru';
    $smtp_port = 587;
    $smtp_user = 'dev@chipsa.ru';
    $smtp_pass = 'motnygbxkzeyuekw';
    $smtp_from = 'dev@chipsa.ru';
    $smtp_from_name = 'DNL dev';

    $phpmailer->isSMTP();

    $phpmailer->Host       = $smtp_host;
    $phpmailer->Port       = $smtp_port;
    $phpmailer->SMTPAuth   = true;

    $phpmailer->Username   = $smtp_user;
    $phpmailer->Password   = $smtp_pass;

    $phpmailer->SMTPSecure = 'tls';

    $phpmailer->CharSet    = 'UTF-8';

    $phpmailer->setFrom(
        $smtp_from,
        $smtp_from_name,
        false
    );
}, 10);


add_action('phpmailer_init', function ($mail) {

    $mail->SMTPDebug = 2;

    $mail->Debugoutput = function ($message, $level) {
        error_log("SMTP [$level]: $message");
    };
}, 20);

add_action('wp_mail_failed', function ($error) {
    error_log(
        'SMTP FAILED: ' . $error->get_error_message()
    );
});
