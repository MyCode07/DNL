<?php

/** Shared validation copy, configured once per site language. */
function frame_cf7_message_language()
{
    return function_exists('pll_current_language') ? (pll_current_language('slug') ?: '') : '';
}

// CF7 also fetches validation schemas with GET; carry the page language on every request.
add_action('wpcf7_enqueue_scripts', function () {
    $language = frame_cf7_message_language();
    if (!$language) return;
    $root = add_query_arg(['lang' => $language, 'rest_route' => '/'], home_url('/'));
    wp_add_inline_script('contact-form-7', 'wpcf7.api.root = ' . wp_json_encode($root) . ';', 'before');
});

function frame_cf7_message_labels()
{
    return [
        'invalid_required' => 'Обязательное поле не заполнено',
        'invalid_email' => 'Некорректный email',
        'invalid_tel' => 'Некорректный телефон',
        'invalid_url' => 'Некорректный URL',
        'invalid_too_short' => 'Слишком короткое значение',
        'invalid_too_long' => 'Слишком длинное значение',
        'invalid_alphabetic' => 'Недопустимые символы в имени или местоположении',
        'accept_terms' => 'Не принято согласие с условиями',
        'validation_error' => 'Общее сообщение об ошибках заполнения',
    ];
}

function frame_cf7_sanitize_messages($input)
{
    $clean = [];
    foreach (['ru', 'en'] as $language) {
        foreach (frame_cf7_message_labels() as $key => $label) {
            $value = is_array($input) ? ($input[$language][$key] ?? '') : '';
            $clean[$language][$key] = is_string($value) ? sanitize_textarea_field($value) : '';
        }
    }
    return $clean;
}

add_action('admin_init', function () {
    register_setting('frame_cf7_messages', 'frame_cf7_messages', [
        'type' => 'array',
        'sanitize_callback' => 'frame_cf7_sanitize_messages',
        'default' => [],
    ]);
});

add_action('admin_menu', function () {
    if (!defined('WPCF7_VERSION')) return;
    global $admin_page_hooks;
    $parent = isset($admin_page_hooks['wpcf7-dashboard']) ? 'wpcf7-dashboard' : 'wpcf7';
    add_submenu_page($parent, 'Сообщения форм', 'Сообщения форм', 'manage_options',
        'frame-cf7-messages', 'frame_cf7_messages_page');
}, 20);

function frame_cf7_messages_page()
{
    if (!current_user_can('manage_options')) return;
    $settings = get_option('frame_cf7_messages', []);
    // Use the toolbar filter, not Polylang's preferred/default editing language.
    $selected_language = function_exists('PLL') ? (PLL()->filter_lang->slug ?? '') : '';
    ?>
    <div class="wrap">
        <h1>Сообщения форм</h1>
        <p>Задайте тексты один раз для каждого языка сайта. Язык сообщений определяется текущей страницей Polylang, независимо от языка формы Contact Form 7.</p>
        <p>Пустое поле сохраняет сообщение из настроек конкретной формы. Эти настройки применяются и при вводе, и при отправке формы.</p>
        <?php settings_errors('frame_cf7_messages'); ?>
        <form action="options.php" method="post">
            <?php settings_fields('frame_cf7_messages'); ?>
            <?php foreach (['ru' => 'Русский', 'en' => 'English'] as $language => $title) : ?>
                <section data-cf7-message-language="<?php echo esc_attr($language); ?>"<?php echo $selected_language && $selected_language !== $language ? ' hidden' : ''; ?>>
                <h2><?php echo esc_html($title); ?></h2>
                <table class="form-table" role="presentation">
                    <?php foreach (frame_cf7_message_labels() as $key => $label) :
                        $id = 'frame-cf7-' . $language . '-' . $key;
                        $value = $settings[$language][$key] ?? '';
                        ?>
                        <tr>
                            <th scope="row"><label for="<?php echo esc_attr($id); ?>"><?php echo esc_html($label); ?></label></th>
                            <td><textarea class="large-text" rows="2" id="<?php echo esc_attr($id); ?>" name="frame_cf7_messages[<?php echo esc_attr($language); ?>][<?php echo esc_attr($key); ?>]"><?php echo esc_textarea($value); ?></textarea></td>
                        </tr>
                    <?php endforeach; ?>
                </table>
                </section>
            <?php endforeach; ?>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// CF7 uses this filter both for SWV schema errors and server validation responses.
add_filter('wpcf7_display_message', function ($message, $status) {
    if (!isset(frame_cf7_message_labels()[$status])) return $message;
    $form = WPCF7_ContactForm::get_current();
    if (!$form) return $message;
    $language = frame_cf7_message_language();
    if (!in_array($language, ['ru', 'en'], true)) return $message;
    $settings = get_option('frame_cf7_messages', []);
    $override = $settings[$language][$status] ?? '';
    return is_string($override) && trim($override) !== '' ? $override : $message;
}, 20, 2);
