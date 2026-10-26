<?php
$query = $args['query'] ?? $GLOBALS['wp_query'];
$page = max(1, (int) $query->get('paged'));
if ($page >= (int) $query->max_num_pages) {
    return;
}
$config = frame_load_more_posts_config($query, $args['template'] ?? 'post');
$static = get_localized_field('knopka_zagruzit_eshhe');
$loading = get_localized_field('knopka_zagruzit_zagruzka');
$error = str_starts_with(get_bloginfo('language'), 'ru')
    ? 'Не удалось загрузить записи. Попробуйте ещё раз.'
    : 'Could not load posts. Please try again.';
?>
<button type="button" class="arrow-btn load-more text-m"
    data-load-more="<?php echo esc_attr(wp_json_encode($config)); ?>"
    data-text-static="<?php echo esc_attr($static); ?>"
    data-text-loading="<?php echo esc_attr($loading); ?>"
    data-text-error="<?php echo esc_attr($error); ?>"><?php echo esc_html($static); ?></button>