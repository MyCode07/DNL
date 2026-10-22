<div class="popup _fixed" id="contact-me">
    <div class="popup-body">
        <?php get_template_part('template-parts/popups/result'); ?>
        <button class="popup-close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#close')); ?>' />
            </svg>
        </button>
        <div class="form">
            <?php echo do_shortcode('[contact-form-7 id="3c0fc4d" title="Обратная связь"]') ?>
        </div>
    </div>
</div>