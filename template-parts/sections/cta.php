<?php
$cta = get_field('cta');
$btn = $cta['knopka'];
?>
<section class="section white cta" id="cta">
    <div class="cta__bg" aria-hidden="true">
        <?php echo wp_get_attachment_image((int) ($cta['fon_desktop'] ?? 0), 'full', false, [
            'class' => 'cta__photo',
            'alt' => '',
            'loading' => 'lazy',
            'sizes' => '(max-width: 767px) 340vw, (max-width: 1280px) 200vw, 160vw',
        ]); ?>
    </div>
    <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#ffffff"
        data-direction="up" aria-hidden="true">
    </div>
    <div class="section__container _container">
        <div class="section__body">
            <div class="section__top">
                <h2><?php echo $cta['zagolovok'] ?></h2>
                <div class="line"><span></span></div>
                <p><?php echo $cta['podzagolovok'] ?></p>
            </div>
            <?php get_template_part('template-parts/_btn', null, ['btn' => $btn]) ?>
        </div>
    </div>
    <div class="pixelated-scroll-transition" data-pixelated-scroll-transition data-color="#ffffff"
        data-direction="down" aria-hidden="true">
    </div>
</section>
