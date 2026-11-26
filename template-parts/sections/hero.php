<?php
$hero = get_field('banner');
$btn = $hero['knopka'];
$list = $hero['spisok'];
?>
<section class="hero white">
    <div class="hero__bg" aria-hidden="true">
        <div class="hero__bg-image">
            <?php echo wp_get_attachment_image(($hero['fon_desktop'] ?? 0), 'full', false, [
                'class' => 'hero__photo',
                'loading' => 'eager',
                'fetchpriority' => 'high',
            ]); ?>
        </div>
    </div>
    <div class="hero__container _container">
        <div class="hero__body">
            <div class="hero__content">
                <h1><?php echo $hero['zagolovok'] ?></h1>
                <p class="h1-subtitle"><?php echo $hero['podzagolovok'] ?></p>
                <div class="hero__button">
                    <?php get_template_part('template-parts/_btn', null, ['btn' => $btn]) ?>
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