<?php
$ceo = get_field('seo');
$list = $ceo['spisok'];
?>
<style>
    .ceo__bg-image {
        background-image: url(<?php echo esc_url($ceo['fon_desktop']) ?>);

        @media (max-width:1024px) {
            background-image: url(<?php echo esc_url($ceo['fon_mobajl']) ?>);
        }
    }
</style>
<section class="section ceo white" id="ceo" data-small-header>
    <div class="ceo__bg">
        <div class="ceo__bg-image"></div>
    </div>
    <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#ffffff"
        data-direction="up" aria-hidden="true">
    </div>
    <div class="section__container _container">
        <div class="section__body">
            <div class="section__top">
                <h2><?php echo $ceo['zagolovok'] ?></h2>
                <div class="line"><span></span></div>
                <div class="h3 ceo-subtitle"><?php echo $ceo['podzagolovok'] ?></div>
            </div>
            <div class="ceo-text"><?php echo $ceo['tekst'] ?></div>

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

            <div class="ceo-quote">
                <svg width="32" height="30" viewBox="0 0 32 30">
                    <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#quote')); ?>' />
                </svg>
                <p class="h4"><?php echo $ceo['czitata'] ?></p>
            </div>
        </div>
    </div>
    <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#000000"
        data-direction="down" aria-hidden="true">
    </div>
</section>