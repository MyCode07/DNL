<?php
$deals = get_field('sdelki');
$list = $deals['spisok'];
if (!$list) return;
?>
<section class="section deals white" id="deals">
    <div class="section__container _container">
        <div class="section__body">
            <div class="section__top">
                <h2><?php echo $deals['zagolovok'] ?></h2>
                <div class="line"><span></span></div>
                <p><?php echo $deals['podzagolovok'] ?></p>
            </div>
            <div class="deals-slider">
                <div class="deals-collection__wrap">
                    <?php foreach ($list as $item): ?>
                        <div class="deals-collection">
                            <div class="deals-media">
                                <div class="deals-media__inner">
                                    <picture>
                                        <source media="(max-width: 767px)" srcset="<?php echo esc_url($item['foto_mobajl']['url']); ?>">
                                        <?php echo wp_get_attachment_image(
                                            $item['foto']['id'],
                                            'full'
                                        ); ?>
                                        <img src="<?php echo esc_url(frame_asset('img/popup-success-desktop.png')); ?>" alt="">
                                    </picture>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
                <div class="deals-controls">
                    <div class="swiper-progress"><span class="swiper-pagination-progressbar-fill"></span></div>
                    <div class="deals-viewport">
                        <div class="deals-track">
                            <?php foreach ($list as $key => $item): ?>
                                <div class="deals-slide <?php if ($key === 0) echo 'active' ?>">
                                    <div class="icon" aria-hidden="true"></div>
                                    <div class="deals-slide__content">
                                        <div class="deals-slide__layer deals-slide__layer--preview" aria-hidden="true">
                                            <div class="deals-slide__head">
                                                <span class="primary-button">0<?php echo $key + 1 ?></span>
                                                <h4><?php echo $item['zagolovok'] ?></h4>
                                            </div>
                                        </div>
                                        <div class="deals-slide__layer deals-slide__layer--detail" aria-hidden="false">
                                            <div class="deals-slide__head">
                                                <span class="primary-button">0<?php echo $key + 1 ?></span>
                                                <h3><?php echo $item['zagolovok'] ?></h3>
                                            </div>
                                            <p class="primary-button"><?php echo $item['tekst'] ?></p>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php get_template_part('template-parts/swiper-navigation') ?>
                </div>
            </div>
        </div>
    </div>
</section>