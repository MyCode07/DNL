<?php
$hero = get_field('banner');
$btn = $hero['knopka'];
$list = $hero['spisok'];
?>
<style>
    .hero__bg-image {
        background-image: url(<?php echo esc_url($hero['fon_desktop']) ?>);

        @media (max-width:1024px) {
            background-image: url(<?php echo esc_url($hero['fon_tablet']) ?>);
        }

        @media (max-width:767px) {
            background-image: url(<?php echo esc_url($hero['fon_mobajl']) ?>);
        }
    }
</style>
<section class="hero white">
    <div class="hero__bg">
        <div class="hero__bg-image"></div>
    </div>
    <div class="hero__container _container">
        <div class="hero__body">
            <div class="hero__content">
                <h1><?php echo $hero['zagolovok'] ?></h1>
                <p class="h1-subtitle"><?php echo $hero['podzagolovok'] ?></p>
                <div class="hero__button">
                    <?php if ($btn['ssylka'] && $btn['ssylka']['url']):
                        echo get_link_info($btn['ssylka'], '_btn _btn-white primary-button');
                    else: ?>
                        <button class="_btn _btn-white primary-button" data-open-popup="popup-<?php echo $btn['popap'] ?>">
                            <?php echo $btn['tekst'] ?>
                        </button>
                    <?php endif; ?>
                </div>
            </div>
            <?php if ($list): ?>
                <div class="glass__grid">
                    <?php foreach ($list as $item): ?>
                        <div class="glass__grid-item">
                            <h4><?php echo $item['zagolovok'] ?></h4>
                            <p class="big-nums"><?php echo $item['tekst'] ?></p>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
    <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#ffffff"
        data-direction="down" aria-hidden="true">
    </div>
</section>