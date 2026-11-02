<?php
$thanks = get_localized_field('uspeshnaya_otpravka');
$error = get_localized_field('oshibka_otpravki');
?>

<div class="popup-result popup-result--success" data-popup-result="success" hidden inert>
    <div class="popup-result__background" aria-hidden="true">
        <picture>
            <source media="(max-width: 767px)" srcset="<?php echo esc_url(frame_asset('img/popup-success-360.png')); ?>">
            <source media="(max-width: 1024px)" srcset="<?php echo esc_url(frame_asset('img/popup-success-mobile.png')); ?>">
            <img src="<?php echo esc_url(frame_asset('img/popup-success-desktop.png')); ?>" alt="">
        </picture>
    </div>
    <div class="popup-result__content" role="status" tabindex="-1">
        <h3 class="h4"><?php echo $thanks['zagolovok'] ?></h3>
        <?php if ($thanks['tekst']): ?>
            <p class="text-s"><?php echo $thanks['tekst'] ?></p>
        <?php endif; ?>
        <a href="<?php echo get_home_page_url() ?>" class="arrow-btn arrow-btn__white text-m">
            <?php echo $thanks['knopka'] ?>
        </a>
    </div>
</div>
<div class="popup-result popup-result--error" data-popup-result="error" hidden inert>
    <div class="popup-result__background" aria-hidden="true">
        <picture>
            <source media="(max-width: 767px)" srcset="<?php echo esc_url(frame_asset('img/popup-error-360.png')); ?>">
            <source media="(max-width: 1024px)" srcset="<?php echo esc_url(frame_asset('img/popup-error-mobile.png')); ?>">
            <img src="<?php echo esc_url(frame_asset('img/popup-error-desktop.png')); ?>" alt="">
        </picture>
    </div>
    <div class="popup-result__content" role="status" tabindex="-1">
        <h3 class="h4"><?php echo $error['zagolovok'] ?></h3>
        <?php if ($error['tekst']): ?>
            <p class="text-s"><?php echo $error['tekst'] ?></p>
        <?php endif; ?>
        <button type="button" class="arrow-btn arrow-btn__white text-m" data-popup-retry><?php echo $error['knopka'] ?></button>
    </div>
</div>