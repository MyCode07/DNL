<?php
$labels = get_field('tegi');
$gallery = get_field('galereya');
$params = get_field('parametry');
?>
<div class="projects-item grid grid-3">
    <div class="projects-item__content">
        <div class="project-name"><?php the_title() ?></div>
        <?php if ($labels): ?>
            <div class="projects-item__labels">
                <?php foreach ($labels as $item): ?>
                    <div class="loc label-m">
                        <span><?php echo $item['tekst'] ?></span>
                        <?php if ($item['dop_tekst']): ?>
                            <span><?php echo $item['dop_tekst'] ?></span>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <div class="projects-item__description" id="project-description-1">
            <p><?php the_field('opisanie') ?></p>
        </div>
        <button type="button" class="projects-item__description-toggle"
            data-text-open="Читать описание" data-text-close="Скрыть" aria-expanded="true"
            aria-controls="project-description-1" hidden>
            <span data-description-label class="text-m"></span>
            <svg width="16" height="12" viewBox="0 0 16 12">
                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#description-toggle')); ?>' />
            </svg>
        </button>
    </div>
    <?php if ($gallery): ?>
        <div class="swiper">
            <div class="swiper-wrapper">
                <?php foreach ($gallery as $item): ?>
                    <div class="swiper-slide">
                        <img src="<?php echo esc_url($item['url']); ?>" alt="<?php echo $item['alt'] ?>">
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="swiper-pagination"></div>
        </div>
    <?php endif; ?>
    <?php if ($params): ?>
        <div class="projects-item__grid grid grid-2">
            <?php foreach ($params as $item): ?>
                <div>
                    <span class="text-m"><?php echo $item['nazvanie'] ?></span>
                    <p class="medium-nums"><?php echo $item['znachenie'] ?></p>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>