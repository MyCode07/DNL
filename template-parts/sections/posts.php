<?php
$publications = get_field('publikaczii');
if ($publications) {
    $all_publications = $publications['ssylka'];
    $title = $publications['zagolovok'];

    $posts = get_posts_custom([
        'post_type' => 'post',
        'posts__in' => $publications['spisok'] ?? false,
        'orderby' => $publications['spisok'] ? 'posts__in' : 'menu_order',
        'order' => 'ASC',
        'count' => count($publications['spisok']) ?? 6,
        'slide' => true,
    ]);
}

if (is_singular('post')) {
    $post_id = get_the_ID();
    $title = get_localized_field('zagolovok_pohozhih_publikaczij');
    $category_ids = wp_get_post_categories($post_id);

    $posts = get_posts_custom([
        'post_type' => 'post',
        'tax_query' => [
            [
                'taxonomy' => 'category',
                'field'    => 'term_id',
                'terms'    => $category_ids,
                'operator' => 'IN',
            ],
        ],
        'orderby' => 'menu_order',
        'order' => 'ASC',
        'count' => 6,
        'slide' => true,
        'exclude' => $post_id,
    ]);
}
?>
<!-- не закончен -->
<section class="section publications <?php echo esc_attr($args['class'] ?? ''); ?>" id="publications" data-dark>
    <div class="section__container _container">
        <div class="section__body">
            <div class="section__top">
                <div class="section__top-flex">
                    <h2><?php echo $title ?></h2>
                    <?php if (is_front_page() && $all_publications && $all_publications['url']): ?>
                        <a href="<?php echo $all_publications['url'] ?>" class="arrow-btn text-m">
                            <?php echo $all_publications['title'] ?>
                            <svg width="13" height="10" viewBox="0 0 13 10">
                                <use xlink:href='<?php echo esc_url(frame_asset('img/svg/icons.svg#menu-btn-arrow')); ?>' />
                            </svg>
                        </a>
                    <?php endif; ?>
                </div>
                <div class="line"><span></span></div>
            </div>
            <div class="swiper">
                <div class="swiper-wrapper">
                    <?php echo $posts; ?>
                    <div class="swiper-slide">
                        <article class="post-item">
                            <div class="post-item__data label-m">
                                <div>
                                    <span class="post-item__author label-m">Андрей Волков — 24 Сен. 2026</span>
                                </div>
                            </div>
                            <h4><a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/">Взгляд на рынок: экосистема ИИ, IPO и недвижимость</a></h4>
                            <a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/" class="img">
                                <div class="post-item__labels">
                                    <span class="label-m">Технологии и рынок</span>
                                </div>
                                <img src="<?php echo esc_url(frame_asset('img/post-1.png')); ?>" alt="">
                            </a>
                            <p>О чем говорит статус Blackstone как одногоиз крупнейших поставщиков частного капитала
                                для экосистемы искусственно...</p>
                        </article>
                    </div>
                    <div class="swiper-slide">
                        <article class="post-item">
                            <div class="post-item__data label-m">
                                <div>
                                    <span class="post-item__author label-m">Мария Орлова — 24 Сен. 2026</span>
                                </div>
                            </div>
                            <h4><a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/">Где же отдача? Денис Лагутенкоиз DNL Capital — о результатах
                                    масштабных...</a></h4>
                            <a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/" class="img">
                                <div class="post-item__labels">
                                    <span class="label-m">Эффективность капитала</span>
                                </div>
                                <img src="<?php echo esc_url(frame_asset('img/post-2.png')); ?>" alt="">
                            </a>
                            <p>Скептики сомневаются</p>
                        </article>
                    </div>
                    <div class="swiper-slide">
                        <article class="post-item">
                            <div class="post-item__data label-m">
                                <div>
                                    <span class="post-item__author label-m">Илья Кузнецов — 21 Сен. 2026</span>
                                </div>
                            </div>
                            <h4><a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/">Инвестиционный прогноз</a></h4>
                            <a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/" class="img">
                                <div class="post-item__labels">
                                    <span class="label-m">Прогнозы</span>
                                </div>
                                <img src="<?php echo esc_url(frame_asset('img/post-3.png')); ?>" alt="">
                            </a>
                            <p>Примечательно, что в сфере искусственного интеллекта (ИИ) — нашей ключевой тематике —
                                наблюдается искл...</p>
                        </article>
                    </div>
                    <div class="swiper-slide">
                        <article class="post-item">
                            <div class="post-item__data label-m">
                                <div>
                                    <span class="post-item__author label-m">Анна Белова — 17 Сен. 2026</span>
                                </div>
                            </div>
                            <h4><a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/">Как формируется доходность</a></h4>
                            <a href="/investiczionnye-strategii/vzglyad-na-rynok-ekosistema-ii-ipo-i-nedvizhimost/" class="img">
                                <div class="post-item__labels">
                                    <span class="label-m">Недвижимость</span>
                                </div>
                                <img src="<?php echo esc_url(frame_asset('img/post-4.png')); ?>" alt="">
                            </a>
                            <p>Разбираем, как реконцепция...</p>
                        </article>
                    </div>
                </div>
            </div>
            <?php get_template_part('template-parts/swiper-navigation') ?>
        </div>
    </div>
</section>