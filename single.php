<?php
get_header();
?>

<main>

    <section class="section text-page single">
        <div class="section__container _container">
            <div class="section__body">
                <div class="single-grid">
                    <div class="section__top">
                        <h1 class="h2"><?php the_title() ?></h1>
                        <div class="line"><span></span></div>
                    </div>
                    <div class="single-data">
                        <div class="single-data__items">
                            <div class="single-data__item">
                                <span class="text-m">Рубрика:</span>
                                <span class="text-m">Инвестиционные стратегии</span>
                            </div>
                            <div class="single-data__double">
                                <div class="single-data__item data-author">
                                    <span class="text-m">Автор:</span>
                                    <span class="text-m">Константин Константинопольский</span>
                                    <div class="single-data__author">
                                        <label class="primary-button">Константин
                                            Константинопольский</label>
                                        <span class="caption">Литературный редактор</span>
                                        <p class="text-s">Публикует аналитические заметкио рыночных трендах, экосистеме
                                            ИИ,IPO и недвижимости.</p>
                                        <button class="arrow-btn">Закрыть</button>
                                    </div>
                                </div>
                                <div class="single-data__item">
                                    <span class="text-m">Проверяющий эксперт:</span>
                                    <span class="text-m">Дмитрий Соколов</span>
                                </div>
                            </div>
                            <div class="single-data__double single-data__date">
                                <div class="single-data__item">
                                    <span class="text-m">Дата публикации:</span>
                                    <span class="text-m">28 Мар. 2026</span>
                                </div>
                                <div class="single-data__item">
                                    <span class="text-m">Обновлено:</span>
                                    <span class="text-m">28 Мар. 2026</span>
                                </div>
                            </div>
                        </div>
                        <?php get_template_part('template-parts/social-share', null, ['class' => '_desktop']) ?>
                    </div>
                    <div class="single-content">
                        <?php if (has_post_thumbnail()): ?>
                            <?php $thumbnail_caption = wp_get_attachment_caption(get_post_thumbnail_id()); ?>
                            <div class="img">
                                <figure>
                                    <?php the_post_thumbnail('full'); ?>
                                    <?php if ($thumbnail_caption): ?>
                                        <figcaption><?php echo esc_html($thumbnail_caption); ?></figcaption>
                                    <?php endif; ?>
                                </figure>
                            </div>
                        <?php endif; ?>
                        <div class="text-box"><?php the_content() ?></div>
                        <?php get_template_part('template-parts/social-share', null, ['class' => '_mobile']) ?>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <?php get_template_part('template-parts/sections/posts', null, ['class' => 'pt0']); ?>

</main>

<?php
get_footer();
