<?php

add_shortcode('custom_checkbox', 'custom_checkbox_shortcode');
function custom_checkbox_shortcode($atts)
{
    $atts = shortcode_atts(array(
        'name'        => 'neme - на латинице',
        'checked'     => '',
        'disabled'    => '',
        'readonly'    => '',
        'title'       => 'Вставьте заголовок...',
        'description' => 'Вставьте текст...',
    ), $atts, 'custom_checkbox');

    $is_checked  = (!empty($atts['checked']) && $atts['checked'] !== 'false' && $atts['checked'] !== '0') ? 'checked' : '';
    $default_checked = $is_checked ? '1' : '0';
    $is_disabled = (!empty($atts['disabled']) && $atts['disabled'] !== 'false' && $atts['disabled'] !== '0') ? 'disabled' : '';
    $is_readonly = (!empty($atts['readonly']) && $atts['readonly'] !== 'false' && $atts['readonly'] !== '0') ? 'readonly aria-readonly="true"' : '';
    if (!$is_disabled && !$is_readonly && stripos($atts['name'], 'cookie') !== false) {
        $saved = Cookies::get($atts['name']);
        if ($saved === '0' || $saved === '1') $is_checked = $saved === '1' ? 'checked' : '';
    }

    ob_start();
?>
    <div class="cookies-checkbox form__privacy">
        <label>
            <input type="checkbox" <?php echo $is_checked; ?> <?php echo $is_disabled; ?> <?php echo $is_readonly; ?> name="<?php echo esc_attr($atts['name']); ?>" data-cookie-default-checked="<?php echo $default_checked; ?>" value="1" aria-invalid="false">
            <span>
                <p><?php echo esc_html($atts['title']); ?></p>
                <p><?php echo esc_html($atts['description']); ?></p>
            </span>
        </label>
    </div>
<?php
    return ob_get_clean();
}
