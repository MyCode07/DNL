<?php
$popups = new WP_Query([
    'post_type' => 'popup',
    'posts_per_page' => -1,
    'post_status' => 'publish',
    'no_found_rows'  => true,
    'suppress_filters'  => false,
]);
if ($popups->have_posts()) :
    while ($popups->have_posts()) :
        $popups->the_post();
        $form = get_field('forma');
        if (!$form) continue;
?>
        <div class="popup" role="dialog" aria-modal="true" tabindex="-1" hidden id="popup-<?php the_ID() ?>">
            <div class="popup-panel">
                <div class="popup-body">
                    <?php get_template_part('template-parts/popups/result'); ?>
                    <button class="popup-close" type="button" title="<?php echo esc_attr(get_localized_field('menyu_zakryt')); ?>">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#close')); ?>' />
                        </svg>
                    </button>
                    <div class="form">
                        <?php echo do_shortcode('[contact-form-7 id="' . $form . '"]'); ?>
                    </div>
                </div>
            </div>
        </div>
<?php endwhile;
    wp_reset_postdata();
endif; ?>
