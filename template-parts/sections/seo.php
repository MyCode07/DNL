<?php
$seo = get_field('seo');
$list = $seo['spisok'];
?>
<style>
    .seo__bg-image {
        background-image: url(<?php echo esc_url($seo['fon_desktop']) ?>);

        @media (max-width:1280px) {
            background-image: url(<?php echo esc_url($seo['fon_tablet']) ?>);
        }

        @media (max-width:1024px) {
            background-image: url(<?php echo esc_url($seo['fon_mobajl']) ?>);
        }

        @media (max-width:767px) {
            background-image: url(<?php echo esc_url($seo['fon_360']) ?>);
        }
    }
</style>
<section class="section seo white" id="seo">
    <div class="seo__bg">
        <div class="seo__bg-image"></div>
    </div>
    <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#ffffff"
        data-direction="up" aria-hidden="true">
    </div>
    <div class="section__container _container">
        <div class="section__body">
            <div class="section__top">
                <h2><?php echo $seo['zagolovok'] ?></h2>
                <div class="line"><span></span></div>
                <div class="h3 seo-subtitle"><?php echo $seo['podzagolovok'] ?></div>
            </div>
            <div class="seo-text"><?php echo $seo['tekst'] ?></div>

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

            <div class="seo-quote">
                <svg width="32" height="30" viewBox="0 0 32 30">
                    <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#quote')); ?>' />
                </svg>
                <p class="h4"><?php echo $seo['czitata'] ?></p>
            </div>
        </div>
    </div>
    <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#000000"
        data-direction="down" aria-hidden="true">
    </div>
</section>