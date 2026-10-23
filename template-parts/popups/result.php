<div class="popup-result popup-result--success" data-popup-result="success" hidden inert>
    <div class="popup-result__background" aria-hidden="true">
        <picture>
            <source media="(max-width: 767px)" srcset="<?php echo esc_url(frame_asset('img/popup-success-360.png')); ?>">
            <source media="(max-width: 1024px)" srcset="<?php echo esc_url(frame_asset('img/popup-success-mobile.png')); ?>">
            <img src="<?php echo esc_url(frame_asset('img/popup-success-desktop.png')); ?>" alt="">
        </picture>
    </div>
    <div class="popup-result__content" role="status" tabindex="-1">
        <h3 class="h4">Заявка успешно<br>отправлена</h3>
        <p class="text-s">Мы рассмотрим вашу заявку<br>и свяжемся с вами по указанным контактам</p>
        <a href="/" class="arrow-btn arrow-btn__white text-m">Вернуться на главную</a>
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
        <h3 class="h4">Не удалось<br>отправить заявку</h3>
        <button type="button" class="arrow-btn arrow-btn__white text-m" data-popup-retry>Попробовать снова</button>
    </div>
</div>