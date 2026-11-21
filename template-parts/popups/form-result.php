<dialog class="popup" id="contact-form-result">
    <div class="popup-panel">
        <div class="popup-body">
            <?php get_template_part('template-parts/popups/result'); ?>
            <button class="popup-close" type="button" title="<?php echo esc_attr(get_localized_field('menyu_zakryt')); ?>">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#close')); ?>' />
                </svg>
            </button>
        </div>
    </div>
</dialog>
