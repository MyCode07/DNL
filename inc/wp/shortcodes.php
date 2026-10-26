<?php

add_shortcode('custom_checkbox', 'custom_checkbox_shortcode');
function custom_checkbox_shortcode($atts)
{
    $atts = shortcode_atts(array(
        'name'        => 'neme - на латинице',
        'checked'     => '',
        'disabled'    => '',
        'title'       => 'Вставьте заголовок...',
        'description' => 'Вставьте текст...',
    ), $atts, 'cookie_checkbox');

    $is_checked  = (!empty($atts['checked']) && $atts['checked'] !== 'false' && $atts['checked'] !== '0') ? 'checked' : '';
    $is_disabled = (!empty($atts['disabled']) && $atts['disabled'] !== 'false' && $atts['disabled'] !== '0') ? 'disabled' : '';

    ob_start();
?>
    <div class="cookies-checkbox form__privacy">
        <label>
            <input type="checkbox" <?php echo $is_checked; ?> <?php echo $is_disabled; ?> name="<?php echo esc_attr($atts['name']); ?>" value="1" aria-invalid="false">
            <span>
                <p><?php echo esc_html($atts['title']); ?></p>
                <p><?php echo esc_html($atts['description']); ?></p>
            </span>
        </label>
    </div>
<?php
    return ob_get_clean();
}
